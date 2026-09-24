import { spawn, type ChildProcess } from 'child_process'
import { createReadStream, watch, type FSWatcher } from 'fs'
import fs from 'fs/promises'
import http, { type ServerResponse } from 'http'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

import { WebSocket, WebSocketServer } from 'ws'

import type { BuildOptions } from './types.ts'
import { toPosix } from './utilities/path.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')
const workingRoot = process.cwd()
const defaultProjectDir = path.join(workingRoot, 'vp')
const defaultAssetsDir = path.join(workingRoot, 'assets')
const defaultInputDir = path.join(workingRoot, 'docs')
const defaultOutputDir = path.join(workingRoot, 'dist')
const defaultConfigDir = path.join(defaultProjectDir, 'config')
const defaultLayoutsDir = path.join(defaultProjectDir, 'layouts')
const defaultComponentsDir = path.join(defaultProjectDir, 'components')
const DEV_PREFIX = '/__vanilla_press_dev/'
const CLIENT_SCRIPT = `${DEV_PREFIX}client.js`
const SOCKET_PATH = `${DEV_PREFIX}ws`
let activeBuildChild: ChildProcess | null = null

export interface DevOptions extends BuildOptions {
  host?: string
  port?: number
}

interface WatchContext {
  rebuild(reason: string): void
  isIgnored(file: string): boolean
}

interface PackageJson {
  version?: string
}

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
}

function resolveDir(value: string | undefined, fallback: string): string {
  return path.resolve(workingRoot, value || fallback)
}

function isInside(parent: string, child: string): boolean {
  const rel = path.relative(parent, child)
  return Boolean(rel) && !rel.startsWith('..') && !path.isAbsolute(rel)
}

function isSameOrInside(parent: string, child: string): boolean {
  return parent === child || isInside(parent, child)
}

function normalizeServePath(url = '/'): string | null {
  let pathname = '/'

  try {
    pathname = new URL(url, 'http://localhost').pathname
  } catch {
    return null
  }

  try {
    pathname = decodeURIComponent(pathname)
  } catch {
    return null
  }

  if (pathname.includes('\0')) return null
  return pathname.replace(/^\/+/, '')
}

async function pathExists(file: string): Promise<boolean> {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

async function loadPackageVersion(): Promise<string> {
  try {
    const file = path.join(packageRoot, 'package.json')
    const pkg = JSON.parse(await fs.readFile(file, 'utf8')) as PackageJson
    const version = String(pkg.version || '').trim()
    return version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function formatBytes(value: number): string {
  const mb = value / 1024 / 1024
  return `${mb.toFixed(1)} MB`
}

function devServerStartMessage(version: string): string {
  return `vanilla-press@${version} Dev Server Start`
}

function devServerAddressMessage(version: string, address: string): string {
  return `vanilla-press@${version} Dev Server: ${address}`
}

function devServerMemoryMessage(): string {
  const memory = process.memoryUsage()
  return `memory: rss=${formatBytes(memory.rss)} heapUsed=${formatBytes(memory.heapUsed)} heapTotal=${formatBytes(memory.heapTotal)} external=${formatBytes(memory.external)} arrayBuffers=${formatBytes(memory.arrayBuffers)}`
}

function green(value: string): string {
  return process.stderr.isTTY ? `\x1b[32m${value}\x1b[0m` : value
}

function clearScreen(): void {
  if (process.stdout.isTTY) process.stdout.write('\x1Bc')
}

function isAddressInUse(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    (error as NodeJS.ErrnoException).code === 'EADDRINUSE'
  )
}

async function isPortAvailable(host: string, port: number): Promise<boolean> {
  const server = http.createServer()

  return new Promise<boolean>((resolve, reject) => {
    server.once('error', (error) => {
      if (isAddressInUse(error)) {
        resolve(false)
        return
      }

      reject(error)
    })
    server.listen(port, host, () => {
      server.close(() => resolve(true))
    })
  })
}

async function findAvailablePort(
  host: string,
  startPort: number
): Promise<number> {
  let nextPort = startPort

  while (!(await isPortAvailable(host, nextPort))) {
    nextPort += 1
  }

  return nextPort
}

async function findStaticFile(
  outputDir: string,
  requestPath: string
): Promise<string | null> {
  const rel = requestPath || 'index.html'
  const candidates = [rel]

  if (rel.endsWith('/')) candidates.push(`${rel}index.html`)
  else if (!path.extname(rel)) candidates.push(`${rel}.html`)

  for (const candidate of candidates) {
    const file = path.resolve(outputDir, candidate)
    if (!isSameOrInside(outputDir, file)) continue

    try {
      const stat = await fs.stat(file)
      if (stat.isFile()) return file
      if (stat.isDirectory()) {
        const indexFile = path.join(file, 'index.html')
        if (await pathExists(indexFile)) return indexFile
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null
}

function reloadClientScript(): string {
  return `const path = ${JSON.stringify(SOCKET_PATH)};
const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const url = protocol + '//' + location.host + path;
let socket;
let retryTimer = 0;
let closed = false;

const close = () => {
  closed = true;
  if (retryTimer) clearTimeout(retryTimer);
  if (socket && socket.readyState < 2) socket.close();
};

const connect = () => {
  if (closed) return;
  socket = new WebSocket(url);
  socket.addEventListener('message', (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (message && message.type === 'reload') {
      close();
      location.reload();
    }
  });
  socket.addEventListener('close', () => {
    if (!closed) retryTimer = setTimeout(connect, 1000);
  });
  socket.addEventListener('error', () => {});
};

window.addEventListener('pagehide', close, { once: true });
window.addEventListener('beforeunload', close, { once: true });
connect();
`
}

function injectReloadClient(html: string): string {
  const script = `<script type="module" src="${CLIENT_SCRIPT}"></script>`
  return /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${script}</body>`)
    : `${html}${script}`
}

function send(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8',
  })
  res.end(body)
}

async function serveStatic(
  outputDir: string,
  req: http.IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const pathname = normalizeServePath(req.url)
  if (pathname === null) {
    send(res, 400, 'Bad request')
    return
  }

  const file = await findStaticFile(outputDir, pathname)
  if (!file) {
    send(res, 404, 'Not found')
    return
  }

  const ext = path.extname(file).toLowerCase()
  const type = mimeTypes[ext] || 'application/octet-stream'

  if (ext === '.html') {
    const html = await fs.readFile(file, 'utf8')
    res.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': type,
    })
    res.end(injectReloadClient(html))
    return
  }

  res.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': type,
  })
  createReadStream(file).pipe(res)
}

function createDevServer(outputDir: string) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://localhost')

    if (url.pathname === CLIENT_SCRIPT) {
      res.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/javascript; charset=utf-8',
      })
      res.end(reloadClientScript())
      return
    }

    serveStatic(outputDir, req, res).catch((error) => {
      console.error(error)
      send(res, 500, 'Internal server error')
    })
  })
  const webSocketServer = new WebSocketServer({ server, path: SOCKET_PATH })

  return {
    server,
    reload() {
      const message = JSON.stringify({ type: 'reload' })

      for (const client of webSocketServer.clients) {
        if (client.readyState !== WebSocket.OPEN) {
          client.terminate()
          continue
        }

        client.send(message)
      }
    },
    close(): Promise<void> {
      for (const client of webSocketServer.clients) {
        client.terminate()
      }

      return new Promise((resolve, reject) => {
        webSocketServer.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    },
  }
}

function buildModuleFile(): string {
  const current = fileURLToPath(import.meta.url)
  const ext = path.extname(current) || '.js'
  return path.join(__dirname, `build${ext}`)
}

function buildEvalCode(options: BuildOptions): string {
  return `const mod = await import(${JSON.stringify(pathToFileURL(buildModuleFile()).href)});
await mod.build(${JSON.stringify(options)});`
}

function runBuild(options: BuildOptions): Promise<void> {
  const child = spawn(
    process.execPath,
    ['--input-type=module', '--eval', buildEvalCode(options)],
    {
      cwd: workingRoot,
      stdio: 'inherit',
    }
  )
  activeBuildChild = child

  return new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (activeBuildChild === child) activeBuildChild = null
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`Build failed with ${signal || `exit code ${code}`}.`))
    })
  })
}

function createBuildRunner(buildOptions: BuildOptions, onSuccess: () => void) {
  let building = false
  let pendingReason = ''

  async function run(reason: string): Promise<void> {
    if (building) {
      pendingReason = reason
      return
    }

    building = true
    pendingReason = ''

    try {
      await runBuild({
        ...buildOptions,
        buildReason: reason,
        reportMode: 'dev',
      })
      onSuccess()
    } catch (error) {
      console.error(error)
    } finally {
      building = false

      if (pendingReason) {
        const nextReason = pendingReason
        pendingReason = ''
        void run(nextReason)
      }
    }
  }

  return run
}

function createDebouncedRebuild(rebuild: (reason: string) => void) {
  let timer: NodeJS.Timeout | null = null
  let latestReason = ''

  return (reason: string): void => {
    latestReason = reason
    if (timer) clearTimeout(timer)

    timer = setTimeout(() => {
      timer = null
      rebuild(latestReason)
    }, 120)
  }
}

function ignoredName(name: string): boolean {
  return (
    name === '.git' ||
    name === '.DS_Store' ||
    name === 'dist' ||
    name === 'node_modules'
  )
}

async function watchDirectory(
  dir: string,
  context: WatchContext,
  watchers: Map<string, FSWatcher>
): Promise<void> {
  const resolved = path.resolve(dir)
  if (watchers.has(resolved) || context.isIgnored(resolved)) return

  let entries
  try {
    entries = await fs.readdir(resolved, { withFileTypes: true })
  } catch {
    return
  }

  const watcher = watch(resolved, (eventType, filename) => {
    const name = filename?.toString()
    if (!name || ignoredName(name)) return

    const file = path.join(resolved, name)
    if (context.isIgnored(file)) return

    context.rebuild(toPosix(path.relative(workingRoot, file)))

    if (eventType === 'rename') {
      fs.stat(file)
        .then((stat) => {
          if (stat.isDirectory()) {
            return watchDirectory(file, context, watchers)
          }
        })
        .catch(() => {
          // Removed files only need a rebuild.
        })
    }
  })
  watcher.on('error', (error) => {
    console.error(error)
  })
  watchers.set(resolved, watcher)

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !ignoredName(entry.name))
      .map((entry) =>
        watchDirectory(path.join(resolved, entry.name), context, watchers)
      )
  )
}

async function watchProject(
  watchRoots: string[],
  ignoredDirs: string[],
  rebuild: (reason: string) => void
): Promise<() => Promise<void>> {
  const watchers = new Map<string, FSWatcher>()
  const resolvedIgnored = ignoredDirs.map((dir) => path.resolve(dir))
  const context: WatchContext = {
    rebuild,
    isIgnored(file) {
      const resolved = path.resolve(file)
      const baseName = path.basename(resolved)

      return (
        ignoredName(baseName) ||
        resolvedIgnored.some((dir) => isSameOrInside(dir, resolved))
      )
    },
  }

  await Promise.all(
    Array.from(new Set(watchRoots.map((dir) => path.resolve(dir)))).map((dir) =>
      watchDirectory(dir, context, watchers)
    )
  )

  return async () => {
    for (const watcher of watchers.values()) {
      watcher.close()
    }
  }
}

export async function dev({
  inputDir = defaultInputDir,
  outputDir = defaultOutputDir,
  assetsDir = defaultAssetsDir,
  configDir = defaultConfigDir,
  layoutsDir = defaultLayoutsDir,
  componentsDir = defaultComponentsDir,
  host = '127.0.0.1',
  port = 3333,
}: DevOptions = {}): Promise<void> {
  const buildOptions: BuildOptions = {
    inputDir: resolveDir(inputDir, defaultInputDir),
    outputDir: resolveDir(outputDir, defaultOutputDir),
    assetsDir: resolveDir(assetsDir, defaultAssetsDir),
    configDir: resolveDir(configDir, defaultConfigDir),
    layoutsDir: resolveDir(layoutsDir, defaultLayoutsDir),
    componentsDir: resolveDir(componentsDir, defaultComponentsDir),
  }
  const clientDir = path.join(
    path.dirname(buildOptions.configDir || ''),
    'client'
  )
  const version = await loadPackageVersion()
  const devPort = await findAvailablePort(host, port)
  const devServer = createDevServer(buildOptions.outputDir || defaultOutputDir)
  const address = `http://${host}:${devPort}/`
  const rebuild = createBuildRunner(buildOptions, () => {
    console.warn(green(devServerMemoryMessage()))
    console.warn(green(devServerAddressMessage(version, address)))
    devServer.reload()
  })
  const debouncedRebuild = createDebouncedRebuild((reason) => {
    void rebuild(reason)
  })

  await new Promise<void>((resolve, reject) => {
    devServer.server.once('error', reject)
    devServer.server.listen(devPort, host, () => resolve())
  })

  clearScreen()
  console.warn(green(devServerStartMessage(version)))
  await rebuild('initial')
  const closeWatchers = await watchProject(
    [
      buildOptions.inputDir || defaultInputDir,
      buildOptions.assetsDir || defaultAssetsDir,
      buildOptions.configDir || defaultConfigDir,
      buildOptions.layoutsDir || defaultLayoutsDir,
      buildOptions.componentsDir || defaultComponentsDir,
      clientDir,
      path.join(packageRoot, 'src'),
    ],
    [buildOptions.outputDir || defaultOutputDir],
    debouncedRebuild
  )

  const close = async () => {
    if (activeBuildChild && !activeBuildChild.killed) {
      activeBuildChild.kill('SIGTERM')
    }
    await closeWatchers()
    await devServer.close()
    await new Promise<void>((resolve) =>
      devServer.server.close(() => resolve())
    )
  }

  process.once('SIGINT', () => {
    close()
      .then(() => {
        process.exitCode = 0
      })
      .catch((error) => {
        console.error(error)
        process.exitCode = 1
      })
  })

  process.once('SIGTERM', () => {
    close()
      .then(() => {
        process.exitCode = 0
      })
      .catch((error) => {
        console.error(error)
        process.exitCode = 1
      })
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  dev({
    inputDir: resolveDir(process.argv[2], defaultInputDir),
    outputDir: resolveDir(process.argv[3], defaultOutputDir),
  }).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
