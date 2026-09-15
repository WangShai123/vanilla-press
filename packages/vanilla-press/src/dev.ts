import { createReadStream, watch, type FSWatcher } from 'fs'
import fs from 'fs/promises'
import http, { type ServerResponse } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

import { glob } from 'glob'
import { WebSocket, WebSocketServer } from 'ws'

import {
  buildComponentScripts,
  buildCss,
  buildClientAssets,
  buildRuntime,
  buildLayoutScripts,
  copyStaticAssets,
  createRuntimeSidebarConfig,
  loadDirectorySidebarItems,
  loadFooterScript,
  loadLastEditCache,
  loadLanguages,
  loadLlmsConfig,
  loadMenuItems,
  loadRobotsConfig,
  loadRuntimeConfig,
  loadSidebarItems,
  pageSharedClientModules,
  readSource,
  renderSearchIndexFiles,
  renderSource,
  resolveI18nData,
  scanClientEntryAssets,
  ensureSourceConfig,
  writeDefaultLocaleEntrypoint,
  writeLastEditCache,
  writeRobots,
  writeSearchIndex,
  writeSitemap,
} from './build.ts'
import { createMarkdown } from './markdown/md.ts'
import { loadLayouts } from './render/layout.ts'
import type {
  BuildOptions,
  BuildReportState,
  ClientEntryAssets,
  FooterScriptConfig,
  LayoutMap,
  LoadedMarkdownComponent,
  ModuleScriptAsset,
  NavItem,
  RenderedPage,
  RuntimeSidebarConfig,
  RuntimeConfig,
  SharedClientModule,
  SourcePage,
  StylesheetAsset,
  UnknownRecord,
} from './types.ts'
import { loadCustomComponents } from './utilities/components.ts'
import { assertEditorSizeConfig } from './utilities/editor-size.ts'
import {
  serverOption,
  isI18nEnabled,
  isLlmsEnabled,
  isRobotsEnabled,
  isSearchEnabled,
  isSitemapEnabled,
} from './utilities/features.ts'
import { markdownRouteRel, renderLlmsTxt } from './utilities/llms.ts'
import { toPosix } from './utilities/path.ts'
import { renderRobotsTxt } from './utilities/robots.ts'

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

interface LastEditEntry {
  hash: string
  at: string
}

type LastEditCache = Record<string, LastEditEntry>

interface DevState {
  inputDir: string
  outputDir: string
  assetsDir: string
  configDir: string
  layoutsDir: string
  componentsDir: string
  clientDir: string
  cacheDir: string
  publicDir: string
  config: RuntimeConfig
  footerScript: FooterScriptConfig
  languages: ReturnType<typeof resolveI18nData>
  menuItems: unknown[]
  sidebarItems: unknown[]
  directorySidebarItems: RuntimeSidebarConfig['directories']
  llmsConfig: UnknownRecord
  robotsConfig: UnknownRecord
  layouts: LayoutMap
  customComponents: LoadedMarkdownComponent[]
  md: Awaited<ReturnType<typeof createMarkdown>>
  lastEditCache: LastEditCache
  sourcesByFile: Map<string, SourcePage>
  pagesByFile: Map<string, RenderedPage>
  componentScriptAssets: Map<string, ModuleScriptAsset>
  layoutScriptAssets: Map<string, ModuleScriptAsset>
  clientEntryAssets: ClientEntryAssets
  sharedClientModules: SharedClientModule[]
  hasRootIndex: boolean
  reportState: BuildReportState
}

function normalizeFileKey(file: string): string {
  return toPosix(file).replace(/^\/+/, '')
}

function resolveMarkdownRel(inputDir: string, file: string): string {
  return normalizeFileKey(path.relative(inputDir, file))
}

function isMarkdownFile(file: string): boolean {
  return path.extname(file).toLowerCase() === '.md'
}

async function readTextIfExists(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, 'utf8')
  } catch {
    return null
  }
}

async function writeTextIfChanged(
  file: string,
  text: string
): Promise<boolean> {
  const current = await readTextIfExists(file)
  if (current === text) return false

  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, text, 'utf8')
  return true
}

async function removeFileIfExists(file: string): Promise<boolean> {
  if (!(await pathExists(file))) return false
  await fs.rm(file, { force: true })
  return true
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
  if (process.stdout.isTTY) {
    process.stdout.write('\x1Bc')
  }
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

function validateRuntimeConfig(config: RuntimeConfig = {}): void {
  assertEditorSizeConfig(config)

  const siteUrl = String(config.siteUrl || '').trim()

  if (!siteUrl) {
    throw new Error(
      'siteUrl is required. Add siteUrl: "https://your-domain.com" to vp/config/runtime.ts.'
    )
  }

  let url: URL
  try {
    url = new URL(siteUrl)
  } catch {
    throw new Error(
      'siteUrl must be an absolute URL, for example: "https://example.com".'
    )
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(
      'siteUrl must be an http(s) URL, for example: "https://example.com".'
    )
  }
}

function devFileMessage(label: string, file: string): string {
  return `${label}: ${toPosix(path.relative(workingRoot, file))}`
}

function collectPages(state: DevState): RenderedPage[] {
  return Array.from(state.pagesByFile.values()).sort((a, b) =>
    a.rel.localeCompare(b.rel)
  )
}

function isSearchIndexOutput(file: string): boolean {
  return /^search(?:\.[A-Za-z0-9._-]+)?\.js$/.test(file)
}

async function removeStaleSearchIndexes(
  publicDir: string,
  expectedFiles: Set<string> = new Set()
): Promise<string[]> {
  const files = await fs.readdir(publicDir).catch(() => [])
  const changed: string[] = []

  await Promise.all(
    files
      .filter((file) => isSearchIndexOutput(file) && !expectedFiles.has(file))
      .map(async (file) => {
        const target = path.join(publicDir, file)
        if (await removeFileIfExists(target)) changed.push(target)
      })
  )

  return changed
}

async function syncSearchIndexes(
  state: DevState,
  pages: RenderedPage[]
): Promise<string[]> {
  const files = renderSearchIndexFiles(pages, state.config, state.languages)
  const changed = await removeStaleSearchIndexes(
    state.publicDir,
    new Set(files.keys())
  )

  for (const [fileName, code] of files) {
    const file = path.join(state.publicDir, fileName)
    if (await writeTextIfChanged(file, code)) changed.push(file)
  }

  return changed
}

function collectSitemap(pages: RenderedPage[], config: RuntimeConfig): string {
  const baseUrl = String(config.siteUrl || '')
    .trim()
    .replace(/\/+$/g, '')
  const urls = pages
    .map((page) => {
      const rel = toPosix(page.rel).replace(/^\/+/, '')
      const encodedRel = rel.split('/').map(encodeURIComponent).join('/')
      return `  <url>\n    <loc>${baseUrl}/${encodedRel}</loc>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

async function loadDevState(options: BuildOptions): Promise<DevState> {
  const inputDir = resolveDir(options.inputDir, defaultInputDir)
  const outputDir = resolveDir(options.outputDir, defaultOutputDir)
  const assetsDir = resolveDir(options.assetsDir, defaultAssetsDir)
  const configDir = resolveDir(options.configDir, defaultConfigDir)
  const layoutsDir = resolveDir(options.layoutsDir, defaultLayoutsDir)
  const componentsDir = resolveDir(options.componentsDir, defaultComponentsDir)
  const clientDir = path.join(path.dirname(configDir), 'client')
  const cacheDir =
    options.cacheDir || path.join(path.dirname(configDir), 'cache')
  const publicDir = path.join(outputDir, 'public')

  await fs.mkdir(inputDir, { recursive: true })
  await fs.mkdir(assetsDir, { recursive: true })
  await fs.mkdir(layoutsDir, { recursive: true })
  await fs.mkdir(componentsDir, { recursive: true })
  await fs.mkdir(clientDir, { recursive: true })
  await ensureSourceConfig(configDir)

  const config = await loadRuntimeConfig(configDir)
  validateRuntimeConfig(config)
  const footerScript = await loadFooterScript(configDir)
  const customComponents = await loadCustomComponents(componentsDir)
  const md = await createMarkdown(config, customComponents)
  const layouts = await loadLayouts({ packageRoot, layoutsDir })
  const languages = isI18nEnabled(config)
    ? resolveI18nData(config, await loadLanguages(configDir))
    : {}
  const menuItems = await loadMenuItems(configDir)
  const sidebarItems = await loadSidebarItems(configDir)
  const directorySidebarItems = await loadDirectorySidebarItems(inputDir)
  const llmsConfig = isLlmsEnabled(config)
    ? await loadLlmsConfig(configDir)
    : {}
  const robotsConfig = isRobotsEnabled(config)
    ? await loadRobotsConfig(configDir)
    : {}
  const lastEditCache = serverOption(config, 'lastEdit')
    ? await loadLastEditCache(cacheDir)
    : {}

  return {
    inputDir,
    outputDir,
    assetsDir,
    configDir,
    layoutsDir,
    componentsDir,
    clientDir,
    cacheDir,
    publicDir,
    config,
    footerScript,
    languages,
    menuItems,
    sidebarItems,
    directorySidebarItems,
    llmsConfig,
    robotsConfig,
    layouts,
    customComponents,
    md,
    lastEditCache,
    sourcesByFile: new Map<string, SourcePage>(),
    pagesByFile: new Map<string, RenderedPage>(),
    componentScriptAssets: new Map<string, ModuleScriptAsset>(),
    layoutScriptAssets: new Map<string, ModuleScriptAsset>(),
    clientEntryAssets: {
      scripts: new Map<string, ModuleScriptAsset>(),
      styles: new Map<string, StylesheetAsset>(),
    },
    sharedClientModules: [],
    hasRootIndex: false,
    reportState: {
      hashes: new Map<string, string>(),
    },
  }
}

async function writeLlmsIndex(state: DevState): Promise<string[]> {
  const pages = collectPages(state)
  const file = path.join(state.outputDir, 'llms.txt')
  const text = renderLlmsTxt(state.llmsConfig, state.config, pages)
  const changed: string[] = []

  if (await writeTextIfChanged(file, text)) {
    changed.push(file)
  }

  return changed
}

async function refreshDevState(state: DevState): Promise<void> {
  const config = await loadRuntimeConfig(state.configDir)
  validateRuntimeConfig(config)

  state.config = config
  state.footerScript = await loadFooterScript(state.configDir)
  state.customComponents = await loadCustomComponents(state.componentsDir)
  state.md = await createMarkdown(config, state.customComponents)
  state.layouts = await loadLayouts({
    packageRoot,
    layoutsDir: state.layoutsDir,
  })
  state.languages = isI18nEnabled(config)
    ? resolveI18nData(config, await loadLanguages(state.configDir))
    : {}
  state.menuItems = await loadMenuItems(state.configDir)
  state.sidebarItems = await loadSidebarItems(state.configDir)
  state.directorySidebarItems = await loadDirectorySidebarItems(state.inputDir)
  state.llmsConfig = isLlmsEnabled(config)
    ? await loadLlmsConfig(state.configDir)
    : {}
  state.robotsConfig = isRobotsEnabled(config)
    ? await loadRobotsConfig(state.configDir)
    : {}
  state.lastEditCache = serverOption(config, 'lastEdit')
    ? await loadLastEditCache(state.cacheDir)
    : {}
}

async function syncPageOutputs(
  state: DevState,
  page: RenderedPage,
  _previousPage: RenderedPage | null
): Promise<string[]> {
  const changed: string[] = []

  const htmlFile = path.join(state.outputDir, page.rel)
  if (await writeTextIfChanged(htmlFile, page.html)) {
    changed.push(htmlFile)
  }

  const markdownFile = path.join(state.outputDir, markdownRouteRel(page))
  if (await writeTextIfChanged(markdownFile, page.markdown)) {
    changed.push(markdownFile)
  }

  return changed
}

async function removePageOutputs(
  state: DevState,
  page: RenderedPage
): Promise<string[]> {
  const changed: string[] = []
  const targets = new Set<string>([
    path.join(state.outputDir, page.rel),
    path.join(state.outputDir, markdownRouteRel(page)),
  ])

  await Promise.all(
    Array.from(targets).map(async (file) => {
      if (await removeFileIfExists(file)) changed.push(file)
    })
  )

  return changed
}

async function refreshGlobalOutputs(
  state: DevState,
  forceRuntime = false
): Promise<string[]> {
  const pages = collectPages(state)
  const changed: string[] = []
  const sharedModules = pageSharedClientModules(pages)
  const runtimeChanged =
    forceRuntime ||
    sharedModules.length !== state.sharedClientModules.length ||
    sharedModules.some(
      (item, index) => item !== state.sharedClientModules[index]
    )

  if (runtimeChanged) {
    await buildRuntime(state.publicDir, {
      config: state.config,
      languages: state.languages,
      menuItems: state.menuItems,
      sidebarItems: createRuntimeSidebarConfig(
        state.sidebarItems,
        state.directorySidebarItems
      ),
      sharedClientModules: sharedModules,
    })
    state.sharedClientModules = sharedModules
    changed.push(path.join(state.publicDir, 'runtime.js'))
  }

  await buildClientAssets(state.outputDir, state.clientDir, pages, state.config)

  if (isSearchEnabled(state.config)) {
    changed.push(...(await syncSearchIndexes(state, pages)))
  } else {
    changed.push(...(await removeStaleSearchIndexes(state.publicDir)))
  }

  if (isSitemapEnabled(state.config)) {
    const file = path.join(state.outputDir, 'sitemap.xml')
    if (await writeTextIfChanged(file, collectSitemap(pages, state.config))) {
      changed.push(file)
    }
  }

  if (isRobotsEnabled(state.config)) {
    const file = path.join(state.outputDir, 'robots.txt')
    if (await writeTextIfChanged(file, renderRobotsTxt(state.robotsConfig))) {
      changed.push(file)
    }
  }

  if (isLlmsEnabled(state.config)) {
    changed.push(...(await writeLlmsIndex(state)))
  }

  if (
    await writeDefaultLocaleEntrypoint(
      state.outputDir,
      state.config,
      state.languages,
      pages,
      state.footerScript,
      state.reportState,
      console.warn,
      'Updated'
    )
  ) {
    changed.push(path.join(state.outputDir, 'index.html'))
  }

  return changed
}

async function rebuildFull(state: DevState, reason: string): Promise<void> {
  console.warn(green(`Build Started: ${reason}`))
  await refreshDevState(state)

  await fs.rm(state.outputDir, { force: true, recursive: true })
  await fs.mkdir(state.outputDir, { recursive: true })
  await fs.mkdir(state.publicDir, { recursive: true })

  if (serverOption(state.config, 'lastEdit')) {
    await fs.mkdir(state.cacheDir, { recursive: true })
  }

  await copyStaticAssets(state.assetsDir, state.publicDir)
  await buildCss(state.publicDir, state.layouts)
  state.componentScriptAssets = await buildComponentScripts(
    state.outputDir,
    state.customComponents
  )
  state.layoutScriptAssets = await buildLayoutScripts(
    state.outputDir,
    state.layouts,
    state.config
  )
  state.clientEntryAssets = await scanClientEntryAssets(
    state.clientDir,
    state.config
  )

  const files = (
    await glob('**/*.md', {
      cwd: state.inputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort()

  state.sourcesByFile.clear()
  state.pagesByFile.clear()

  const sources = await Promise.all(
    files.map(async (file) =>
      readSource(
        file,
        await fs.readFile(path.join(state.inputDir, file), 'utf8')
      )
    )
  )

  state.hasRootIndex = sources.some((source) => source.rel === 'index.html')

  for (const source of sources) {
    state.sourcesByFile.set(source.file, source)
    const page = renderSource(
      source,
      state.md,
      state.config,
      state.languages,
      state.menuItems as NavItem[],
      createRuntimeSidebarConfig(
        state.sidebarItems,
        state.directorySidebarItems
      ),
      state.layouts,
      state.componentScriptAssets,
      state.layoutScriptAssets,
      state.clientEntryAssets,
      state.llmsConfig,
      state.footerScript,
      state.lastEditCache,
      state.hasRootIndex
    )
    state.pagesByFile.set(source.file, page)
  }

  const pages = collectPages(state)
  state.sharedClientModules = pageSharedClientModules(pages)

  await buildRuntime(state.publicDir, {
    config: state.config,
    languages: state.languages,
    menuItems: state.menuItems,
    sidebarItems: createRuntimeSidebarConfig(
      state.sidebarItems,
      state.directorySidebarItems
    ),
    sharedClientModules: state.sharedClientModules,
  })
  await buildClientAssets(state.outputDir, state.clientDir, pages, state.config)

  if (isSearchEnabled(state.config)) {
    await writeSearchIndex(
      state.publicDir,
      pages,
      state.config,
      state.languages
    )
  }

  if (isSitemapEnabled(state.config)) {
    await writeSitemap(state.outputDir, pages, state.config)
  }

  if (isRobotsEnabled(state.config)) {
    await writeRobots(state.outputDir, state.robotsConfig)
  }

  if (isLlmsEnabled(state.config)) {
    await writeTextIfChanged(
      path.join(state.outputDir, 'llms.txt'),
      renderLlmsTxt(state.llmsConfig, state.config, pages)
    )
    await Promise.all(
      pages.map(async (page) => {
        const file = path.join(state.outputDir, markdownRouteRel(page))
        await writeTextIfChanged(file, page.markdown)
      })
    )
  }

  if (serverOption(state.config, 'lastEdit')) {
    await writeLastEditCache(state.cacheDir, state.lastEditCache)
  }

  await Promise.all(
    pages.map(async (page) => {
      await syncPageOutputs(state, page, null)
      console.warn(
        green(devFileMessage('built', path.join(state.outputDir, page.rel)))
      )
    })
  )

  await writeDefaultLocaleEntrypoint(
    state.outputDir,
    state.config,
    state.languages,
    pages,
    state.footerScript,
    state.reportState,
    console.warn,
    'built'
  )
}

async function rebuildMarkdown(state: DevState, reason: string): Promise<void> {
  const absFile = path.resolve(workingRoot, reason)
  if (!isSameOrInside(state.inputDir, absFile)) {
    throw new Error(`Unsupported incremental target: ${reason}`)
  }

  const relFile = resolveMarkdownRel(state.inputDir, absFile)
  const previousPage = state.pagesByFile.get(relFile) || null
  const exists = await pathExists(absFile)

  if (!exists) {
    if (previousPage) {
      if (previousPage.rel === 'index.html') {
        state.sourcesByFile.delete(relFile)
        state.pagesByFile.delete(relFile)
        await rebuildFull(state, reason)
        return
      }

      state.sourcesByFile.delete(relFile)
      state.pagesByFile.delete(relFile)
      await removePageOutputs(state, previousPage)
      if (serverOption(state.config, 'lastEdit')) {
        delete state.lastEditCache[relFile]
        await writeLastEditCache(state.cacheDir, state.lastEditCache)
      }
    }
    return
  }

  const markdown = await fs.readFile(absFile, 'utf8')
  const source = readSource(relFile, markdown)

  if (!previousPage && source.rel === 'index.html' && state.hasRootIndex) {
    // Another root index already exists; fall back to a full rebuild to keep
    // locale home links and the default entrypoint consistent.
    await rebuildFull(state, reason)
    return
  }

  if (!previousPage && source.rel === 'index.html' && !state.hasRootIndex) {
    await rebuildFull(state, reason)
    return
  }

  state.sourcesByFile.set(source.file, source)
  const page = renderSource(
    source,
    state.md,
    state.config,
    state.languages,
    state.menuItems as NavItem[],
    createRuntimeSidebarConfig(state.sidebarItems, state.directorySidebarItems),
    state.layouts,
    state.componentScriptAssets,
    state.layoutScriptAssets,
    state.clientEntryAssets,
    state.llmsConfig,
    state.footerScript,
    state.lastEditCache,
    state.hasRootIndex
  )
  state.pagesByFile.set(source.file, page)

  const changed = await syncPageOutputs(state, page, previousPage)
  if (serverOption(state.config, 'lastEdit')) {
    await writeLastEditCache(state.cacheDir, state.lastEditCache)
  }

  const globalChanges = await refreshGlobalOutputs(state)
  const allChanges = [...changed, ...globalChanges]
  for (const file of allChanges) {
    console.warn(devFileMessage('Updated', file))
  }
}

function createDevRunner(state: DevState, onSuccess: (reason: string) => void) {
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
      if (reason === 'initial') {
        await rebuildFull(state, reason)
      } else if (isMarkdownFile(path.resolve(workingRoot, reason))) {
        await rebuildMarkdown(state, reason)
      } else {
        await rebuildFull(state, reason)
      }
      onSuccess(reason)
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
  const state = await loadDevState({
    inputDir,
    outputDir,
    assetsDir,
    configDir,
    layoutsDir,
    componentsDir,
  })
  const version = await loadPackageVersion()
  const devPort = await findAvailablePort(host, port)
  const devServer = createDevServer(state.outputDir)
  const address = `http://${host}:${devPort}/`
  const rebuild = createDevRunner(state, () => {
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
      inputDir,
      assetsDir,
      configDir,
      layoutsDir,
      componentsDir,
      state.clientDir,
      path.join(packageRoot, 'src'),
    ],
    [state.outputDir],
    debouncedRebuild
  )

  const close = async () => {
    await closeWatchers()
    await devServer.close()
    await new Promise<void>((resolve) =>
      devServer.server.close(() => resolve())
    )
  }

  process.once('SIGINT', () => {
    close()
      .catch((error) => console.error(error))
      .finally(() => process.exit(0))
  })
  process.once('SIGTERM', () => {
    close()
      .catch((error) => console.error(error))
      .finally(() => process.exit(0))
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  dev({
    inputDir: process.argv[2],
    outputDir: process.argv[3],
  }).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
