import { createHash } from 'crypto'
import { createReadStream, watch, type FSWatcher } from 'fs'
import fs from 'fs/promises'
import http, { type ServerResponse } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

import { glob } from 'glob'
import { WebSocket, WebSocketServer } from 'ws'

import {
  buildClientAssets,
  buildComponentScripts,
  buildCss,
  buildLayoutScripts,
  buildRuntime,
  copyStaticAssets,
  createRuntimeSidebarConfig,
  ensureSourceConfig,
  loadDirectorySidebarItems,
  loadFooterScript,
  loadLanguages,
  loadLastEditCache,
  loadLlmsConfig,
  loadMenuItems,
  loadRobotsConfig,
  loadRuntimeConfig,
  loadSidebarItems,
  pageSharedClientModules,
  readSource,
  renderSource,
  markdownCodeLanguages,
  resolveI18nData,
  scanClientEntryAssets,
  validateRuntimeConfig,
  writeDefaultLocaleEntrypoint,
  writeLastEditCache,
  writeLlms,
  writeRobots,
  writeSearchIndex,
  writeSitemap,
} from './build.ts'
import { clearCodeHighlighterCache } from './markdown/highlight.ts'
import { createMarkdown } from './markdown/md.ts'
import { loadLayouts } from './render/layout.ts'
import type {
  BuildOptions,
  ClientEntryAssets,
  FooterScriptConfig,
  LanguagesConfig,
  LayoutMap,
  LoadedMarkdownComponent,
  ModuleScriptAsset,
  NavItem,
  RenderedPage,
  RuntimeConfig,
  RuntimeSidebar,
  SharedClientModule,
  SourcePage,
  UnknownRecord,
} from './types.ts'
import { loadCustomComponents } from './utilities/components.ts'
import {
  isI18nEnabled,
  isLlmsEnabled,
  isRobotsEnabled,
  isSearchEnabled,
  isSitemapEnabled,
  serverOption,
} from './utilities/features.ts'
import { markdownRouteRel } from './utilities/llms.ts'
import { relativeAsset, toPosix } from './utilities/path.ts'

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
const HASHED_ASSET_RE = /\.[a-f0-9]{8}\.(?:js|css)$/i

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

type MarkdownItInstance = Awaited<ReturnType<typeof createMarkdown>>
type LastEditCache = Awaited<ReturnType<typeof loadLastEditCache>>

interface AssetUpdate {
  logical: string
  previous?: string
  current: string
}

interface DevManifest {
  assets: Map<string, string>
}

interface DevState {
  inputDir: string
  outputDir: string
  publicDir: string
  assetsDir: string
  configDir: string
  layoutsDir: string
  componentsDir: string
  cacheDir: string
  pageCacheDir: string
  clientDir: string
  config: RuntimeConfig
  footerScript: FooterScriptConfig
  customComponents: LoadedMarkdownComponent[]
  layouts: LayoutMap
  languages: LanguagesConfig
  menuItems: unknown[]
  sidebarItems: unknown[]
  runtimeSidebarItems: RuntimeSidebar
  llmsConfig: UnknownRecord
  robotsConfig: UnknownRecord
  md: MarkdownItInstance | null
  markdownLanguages: string[]
  lastEditCache: LastEditCache
  sourceFiles: Map<string, SourcePage>
  pages: Map<string, RenderedPage>
  componentScriptAssets: Map<string, ModuleScriptAsset>
  layoutScriptAssets: Map<string, ModuleScriptAsset>
  clientEntryAssets: ClientEntryAssets
  sharedClientModules: SharedClientModule[]
  hasRootIndex: boolean
  manifest: DevManifest
}

interface DevPageCacheItem {
  file: string
  rel: string
  title: string
  seo: SourcePage['seo']
  content: string
  html: string
  markdown: string
}

interface DevServer {
  server: http.Server
  send(message: unknown): void
  reload(): void
  style(updates: AssetUpdate[]): void
  close(): Promise<void>
}

interface ResolvedBuildOptions {
  inputDir: string
  outputDir: string
  assetsDir: string
  configDir: string
  cacheDir: string
  layoutsDir: string
  componentsDir: string
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

function rootPath(rel: string): string {
  return `/${toPosix(rel).replace(/^\/+/, '')}`
}

function contentHash(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 8)
}

function hashRel(logicalRel: string, hash: string): string {
  const ext = path.posix.extname(logicalRel)
  const base = logicalRel.slice(0, -ext.length)
  return `${base}.${hash}${ext}`
}

function isHashableAsset(rel: string): boolean {
  return /\.(?:js|css)$/i.test(rel) && !HASHED_ASSET_RE.test(rel)
}

function sameList(a: string[] = [], b: string[] = []): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index])
}

function pageList(state: DevState): RenderedPage[] {
  return Array.from(state.pages.values()).sort((a, b) =>
    a.rel.localeCompare(b.rel)
  )
}

function sourceList(state: DevState): SourcePage[] {
  return Array.from(state.sourceFiles.values()).sort((a, b) =>
    a.rel.localeCompare(b.rel)
  )
}

function compactSource(source: SourcePage): SourcePage {
  return {
    ...source,
    frontmatter: {},
    markdown: '',
    seo: {},
  }
}

function compactPage(page: RenderedPage): RenderedPage {
  return {
    ...page,
    frontmatter: {},
    markdown: '',
    body: '',
    content: '',
    html: '',
  }
}

function pageCacheFile(state: DevState, file: string): string {
  return path.join(state.pageCacheDir, `.${contentHash(file)}.json`)
}

async function writePageCache(
  state: DevState,
  page: RenderedPage
): Promise<void> {
  const item: DevPageCacheItem = {
    file: page.file,
    rel: page.rel,
    title: page.title,
    seo: page.seo,
    content: page.content,
    html: page.html,
    markdown: page.markdown,
  }

  await writeTextIfChanged(
    pageCacheFile(state, page.file),
    `${JSON.stringify(item)}\n`
  )
}

async function removePageCache(state: DevState, file: string): Promise<void> {
  await removeFileIfExists(pageCacheFile(state, file))
}

async function readPageCache(
  state: DevState,
  file: string
): Promise<DevPageCacheItem | null> {
  try {
    return JSON.parse(
      await fs.readFile(pageCacheFile(state, file), 'utf8')
    ) as DevPageCacheItem
  } catch {
    return null
  }
}

async function globalPageList(state: DevState): Promise<RenderedPage[]> {
  const pages: RenderedPage[] = []

  for (const [file, page] of state.pages) {
    const cached = await readPageCache(state, file)
    pages.push({
      ...page,
      content: cached?.content || '',
      html: cached?.html || '',
      markdown: cached?.markdown || '',
      seo: cached?.seo || page.seo,
      title: cached?.title || page.title,
    })
  }

  return pages.sort((a, b) => a.rel.localeCompare(b.rel))
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

function devClientScript(): string {
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

const normalizePath = (value) => {
  try {
    return new URL(value, location.href).pathname;
  } catch {
    return value;
  }
};

const updateStyles = (updates) => {
  let updated = false;
  for (const item of updates || []) {
    const previous = normalizePath(item.previous || item.logical || '');
    const current = normalizePath(item.current || '');
    const logical = normalizePath(item.logical || '');
    const link = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find((el) => {
      const href = normalizePath(el.getAttribute('href') || el.href);
      return href === previous || href === logical;
    });

    if (!link || !current) continue;
    const next = link.cloneNode();
    next.href = current + (current.includes('?') ? '&' : '?') + 't=' + Date.now();
    next.addEventListener('load', () => link.remove(), { once: true });
    link.after(next);
    updated = true;
  }

  if (!updated) location.reload();
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
    if (!message || typeof message.type !== 'string') return;
    if (message.type === 'style') {
      updateStyles(message.updates);
      return;
    }
    if (message.type === 'reload') {
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

function injectDevClient(html: string): string {
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
    res.end(injectDevClient(html))
    return
  }

  res.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': type,
  })
  createReadStream(file).pipe(res)
}

function createDevServer(outputDir: string): DevServer {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://localhost')

    if (url.pathname === CLIENT_SCRIPT) {
      res.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/javascript; charset=utf-8',
      })
      res.end(devClientScript())
      return
    }

    serveStatic(outputDir, req, res).catch((error) => {
      console.error(error)
      send(res, 500, 'Internal server error')
    })
  })
  const webSocketServer = new WebSocketServer({ server, path: SOCKET_PATH })

  const api: DevServer = {
    server,
    send(message: unknown) {
      const payload = JSON.stringify(message)

      for (const client of webSocketServer.clients) {
        if (client.readyState !== WebSocket.OPEN) {
          client.terminate()
          continue
        }

        client.send(payload)
      }
    },
    reload() {
      api.send({ type: 'reload' })
    },
    style(updates: AssetUpdate[]) {
      api.send({
        type: 'style',
        updates: updates.map((item) => ({
          logical: rootPath(item.logical),
          previous: rootPath(item.previous || item.logical),
          current: rootPath(item.current),
        })),
      })
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

  return api
}

async function writeTextIfChanged(
  file: string,
  text: string
): Promise<boolean> {
  try {
    if ((await fs.readFile(file, 'utf8')) === text) return false
  } catch {
    // New file.
  }

  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, text, 'utf8')
  return true
}

async function removeFileIfExists(file: string): Promise<void> {
  await fs.rm(file, { force: true }).catch(() => {})
}

async function hashAsset(
  state: DevState,
  logicalRel: string
): Promise<AssetUpdate | null> {
  if (!isHashableAsset(logicalRel)) return null

  const sourceFile = path.join(state.outputDir, logicalRel)
  if (!(await pathExists(sourceFile))) return null

  const bytes = await fs.readFile(sourceFile)
  const current = hashRel(logicalRel, contentHash(bytes))
  const previous = state.manifest.assets.get(logicalRel)
  const targetFile = path.join(state.outputDir, current)

  await fs.mkdir(path.dirname(targetFile), { recursive: true })
  await fs.writeFile(targetFile, bytes)
  state.manifest.assets.set(logicalRel, current)

  if (previous && previous !== current) {
    await removeFileIfExists(path.join(state.outputDir, previous))
  }

  return previous === current
    ? null
    : { logical: logicalRel, previous, current }
}

async function hashAssets(
  state: DevState,
  logicalRels: Iterable<string>
): Promise<AssetUpdate[]> {
  const updates: AssetUpdate[] = []

  for (const rel of Array.from(new Set(logicalRels)).sort()) {
    const update = await hashAsset(state, rel)
    if (update) updates.push(update)
  }

  return updates
}

async function stableClientAssetRels(state: DevState): Promise<string[]> {
  const files = await glob('public/client/**/*.{js,css}', {
    cwd: state.outputDir,
    nodir: true,
    windowsPathsNoEscape: true,
  }).catch(() => [])

  return files
    .map(toPosix)
    .filter((file) => !HASHED_ASSET_RE.test(file))
    .sort((a, b) => a.localeCompare(b))
}

async function stableSearchAssetRels(state: DevState): Promise<string[]> {
  const files = await glob('search*.js', {
    cwd: state.publicDir,
    nodir: true,
    windowsPathsNoEscape: true,
  }).catch(() => [])

  return files
    .map((file) => `public/${toPosix(file)}`)
    .filter((file) => !HASHED_ASSET_RE.test(file))
    .sort((a, b) => a.localeCompare(b))
}

function applyManifestToHtml(
  state: DevState,
  pageRel: string,
  html: string
): string {
  let next = html

  for (const [logical, hashed] of state.manifest.assets) {
    next = next
      .split(relativeAsset(pageRel, logical))
      .join(relativeAsset(pageRel, hashed))
  }

  return next
}

async function writePageOutput(
  state: DevState,
  page: RenderedPage
): Promise<void> {
  const cached = page.html ? null : await readPageCache(state, page.file)
  const html = page.html || cached?.html || ''
  if (!html) return

  const outputFile = path.join(state.outputDir, page.rel)
  await writeTextIfChanged(
    outputFile,
    applyManifestToHtml(state, page.rel, html)
  )
}

async function writeMarkdownRoute(
  state: DevState,
  page: RenderedPage
): Promise<void> {
  if (!isLlmsEnabled(state.config)) return
  const cached = page.markdown ? null : await readPageCache(state, page.file)
  const markdown = page.markdown || cached?.markdown || ''
  if (!markdown) return

  const outputFile = path.join(state.outputDir, markdownRouteRel(page))
  await writeTextIfChanged(outputFile, markdown)
}

async function writeRenderedPageOutputs(
  state: DevState,
  pages: RenderedPage[]
): Promise<void> {
  await Promise.all(
    pages.map(async (page) => {
      await writePageOutput(state, page)
      await writeMarkdownRoute(state, page)
    })
  )
}

async function rewriteHtmlAssetsForUpdates(
  state: DevState,
  updates: AssetUpdate[]
): Promise<void> {
  if (!updates.length) return

  const files = (
    await glob('**/*.html', {
      cwd: state.outputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort()

  await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(state.outputDir, file)
      let html = await fs.readFile(fullPath, 'utf8')
      const pageRel = toPosix(file)

      for (const update of updates) {
        const next = relativeAsset(pageRel, update.current)
        html = html.split(relativeAsset(pageRel, update.logical)).join(next)

        if (update.previous) {
          html = html.split(relativeAsset(pageRel, update.previous)).join(next)
        }
      }

      await writeTextIfChanged(fullPath, html)
    })
  )
}

async function rewriteDefaultLocaleEntrypoint(state: DevState): Promise<void> {
  const indexFile = path.join(state.outputDir, 'index.html')
  if (!(await pathExists(indexFile))) return

  const html = await fs.readFile(indexFile, 'utf8')
  await writeTextIfChanged(
    indexFile,
    applyManifestToHtml(state, 'index.html', html)
  )
}

function renderPage(state: DevState, source: SourcePage): RenderedPage {
  if (!state.md) {
    throw new Error('Markdown renderer is not initialized.')
  }

  return renderSource(
    source,
    state.md,
    state.config,
    state.languages,
    state.menuItems as NavItem[],
    state.runtimeSidebarItems,
    state.layouts,
    state.componentScriptAssets,
    state.layoutScriptAssets,
    state.clientEntryAssets,
    state.llmsConfig,
    state.footerScript,
    state.lastEditCache,
    state.hasRootIndex
  )
}

async function setPage(
  state: DevState,
  source: SourcePage
): Promise<RenderedPage> {
  const page = renderPage(state, source)
  await writePageCache(state, page)
  state.sourceFiles.set(source.file, compactSource(source))
  state.pages.set(source.file, compactPage(page))
  return page
}

async function loadSourceFile(
  state: Pick<DevState, 'inputDir'>,
  file: string
): Promise<SourcePage> {
  const markdown = await fs.readFile(path.join(state.inputDir, file), 'utf8')
  return readSource(file, markdown)
}

async function loadAllSources(
  inputDir: string
): Promise<Map<string, SourcePage>> {
  const files = (
    await glob('**/*.md', {
      cwd: inputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort()
  const entries = files.map(
    (file) =>
      [
        file,
        {
          file,
          markdown: '',
          frontmatter: {},
          seo: {},
          rel: toPosix(file).replace(/\.md$/i, '.html'),
          title: path.basename(file).replace(/\.md$/i, ''),
        },
      ] as const
  )

  return new Map(entries)
}

async function loadMarkdownLanguages(inputDir: string): Promise<string[]> {
  const files = (
    await glob('**/*.md', {
      cwd: inputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort()
  const languages = new Set<string>()

  for (const file of files) {
    const markdown = await fs.readFile(path.join(inputDir, file), 'utf8')
    for (const language of markdownCodeLanguages(markdown)) {
      languages.add(language)
    }
  }

  return Array.from(languages).sort()
}

async function loadConfigState(state: DevState): Promise<void> {
  await ensureSourceConfig(state.configDir)
  state.config = await loadRuntimeConfig(state.configDir)
  validateRuntimeConfig(state.config)
  state.footerScript = await loadFooterScript(state.configDir)
  state.customComponents = await loadCustomComponents(state.componentsDir)
  state.layouts = await loadLayouts({
    packageRoot,
    layoutsDir: state.layoutsDir,
  })
  state.languages = isI18nEnabled(state.config)
    ? resolveI18nData(state.config, await loadLanguages(state.configDir))
    : {}
  state.menuItems = await loadMenuItems(state.configDir)
  state.sidebarItems = await loadSidebarItems(state.configDir)
  const directorySidebarItems = await loadDirectorySidebarItems(state.inputDir)
  state.runtimeSidebarItems = createRuntimeSidebarConfig(
    state.sidebarItems,
    directorySidebarItems
  )
  state.llmsConfig = isLlmsEnabled(state.config)
    ? await loadLlmsConfig(state.configDir)
    : {}
  state.robotsConfig = isRobotsEnabled(state.config)
    ? await loadRobotsConfig(state.configDir)
    : {}
  state.lastEditCache = serverOption(state.config, 'lastEdit')
    ? await loadLastEditCache(state.cacheDir)
    : {}
}

async function refreshMarkdownRenderer(state: DevState): Promise<boolean> {
  const languages = await loadMarkdownLanguages(state.inputDir)
  const languagesChanged = !sameList(languages, state.markdownLanguages)
  if (state.md && !languagesChanged) return false

  if (state.md) await clearCodeHighlighterCache()
  state.markdownLanguages = languages
  state.md = await createMarkdown(
    state.config,
    state.customComponents,
    languages
  )
  return languagesChanged
}

async function releaseMarkdownRenderer(state: DevState): Promise<void> {
  state.md = null
  await clearCodeHighlighterCache()
}

async function rebuildStyle(state: DevState): Promise<AssetUpdate[]> {
  await buildCss(state.publicDir, state.layouts)
  return hashAssets(state, ['public/styles.css'])
}

async function rebuildRuntime(
  state: DevState,
  force = false
): Promise<AssetUpdate[]> {
  const sharedClientModules = pageSharedClientModules(pageList(state))
  if (!force && sameList(sharedClientModules, state.sharedClientModules)) {
    return []
  }

  state.sharedClientModules = sharedClientModules
  await buildRuntime(state.publicDir, {
    config: state.config,
    languages: state.languages,
    menuItems: state.menuItems,
    sidebarItems: state.runtimeSidebarItems,
    sharedClientModules,
  })
  return hashAssets(state, ['public/runtime.js'])
}

async function rebuildClientAssets(
  state: DevState,
  pages: RenderedPage[]
): Promise<AssetUpdate[]> {
  await buildClientAssets(state.outputDir, state.clientDir, pages, state.config)
  return hashAssets(state, await stableClientAssetRels(state))
}

async function writeGlobalOutputs(state: DevState): Promise<AssetUpdate[]> {
  const pages = await globalPageList(state)

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
  if (isLlmsEnabled(state.config)) {
    await writeLlms(state.outputDir, pages, state.config, state.llmsConfig)
  }
  if (isRobotsEnabled(state.config)) {
    await writeRobots(state.outputDir, state.robotsConfig)
  }
  if (serverOption(state.config, 'lastEdit')) {
    await fs.mkdir(state.cacheDir, { recursive: true })
    await writeLastEditCache(state.cacheDir, state.lastEditCache)
  }

  return hashAssets(state, await stableSearchAssetRels(state))
}

async function writeDefaultEntrypoint(state: DevState): Promise<void> {
  await writeDefaultLocaleEntrypoint(
    state.outputDir,
    state.config,
    state.languages,
    pageList(state),
    state.footerScript
  )
  await rewriteDefaultLocaleEntrypoint(state)
}

async function renderAllPages(state: DevState): Promise<RenderedPage[]> {
  state.hasRootIndex = sourceList(state).some(
    (source) => source.rel === 'index.html'
  )
  const pages: RenderedPage[] = []

  for (const item of sourceList(state)) {
    const source = await loadSourceFile(state, item.file)
    const page = renderPage(state, source)
    await writePageCache(state, page)
    state.sourceFiles.set(source.file, compactSource(source))
    const compact = compactPage(page)
    state.pages.set(source.file, compact)
    pages.push(compact)
  }

  return pages
}

async function createInitialState(
  options: ResolvedBuildOptions
): Promise<DevState> {
  const publicDir = path.join(options.outputDir, 'public')
  const state: DevState = {
    inputDir: options.inputDir,
    outputDir: options.outputDir,
    publicDir,
    assetsDir: options.assetsDir,
    configDir: options.configDir,
    layoutsDir: options.layoutsDir,
    componentsDir: options.componentsDir,
    cacheDir: options.cacheDir,
    pageCacheDir: path.join(options.cacheDir, '.dev-pages'),
    clientDir: path.join(path.dirname(options.configDir), 'client'),
    config: {},
    footerScript: '',
    customComponents: [],
    layouts: new Map(),
    languages: {},
    menuItems: [],
    sidebarItems: [],
    runtimeSidebarItems: [],
    llmsConfig: {},
    robotsConfig: {},
    md: null,
    markdownLanguages: [],
    lastEditCache: {},
    sourceFiles: new Map(),
    pages: new Map(),
    componentScriptAssets: new Map(),
    layoutScriptAssets: new Map(),
    clientEntryAssets: { scripts: new Map(), styles: new Map() },
    sharedClientModules: [],
    hasRootIndex: false,
    manifest: { assets: new Map() },
  }

  await fs.mkdir(options.inputDir, { recursive: true })
  await fs.mkdir(options.assetsDir, { recursive: true })
  await fs.mkdir(options.layoutsDir, { recursive: true })
  await fs.mkdir(options.componentsDir, { recursive: true })
  await fs.mkdir(state.clientDir, { recursive: true })
  await fs.rm(options.outputDir, { force: true, recursive: true })
  await fs.rm(state.pageCacheDir, { force: true, recursive: true })
  await fs.mkdir(state.pageCacheDir, { recursive: true })
  await fs.mkdir(publicDir, { recursive: true })
  await loadConfigState(state)
  state.sourceFiles = await loadAllSources(options.inputDir)
  await refreshMarkdownRenderer(state)
  await copyStaticAssets(options.assetsDir, publicDir)
  await rebuildStyle(state)
  state.componentScriptAssets = await buildComponentScripts(
    options.outputDir,
    state.customComponents
  )
  state.layoutScriptAssets = await buildLayoutScripts(
    options.outputDir,
    state.layouts,
    state.config
  )
  state.clientEntryAssets = await scanClientEntryAssets(
    state.clientDir,
    state.config
  )
  const pages = await renderAllPages(state)
  await releaseMarkdownRenderer(state)
  await rebuildRuntime(state, true)
  await rebuildClientAssets(state, pages)
  await writeGlobalOutputs(state)
  await writeRenderedPageOutputs(state, pages)
  await writeDefaultEntrypoint(state)

  return state
}

function pageUsesClientImport(
  page: RenderedPage,
  predicate: (specifier: string) => boolean
): boolean {
  return [
    ...(page.layoutScript?.clientImports || []),
    ...page.clientEntries.flatMap((entry) => entry.clientImports || []),
  ].some((item) => predicate(item.specifier))
}

function pagesForClientFile(state: DevState, file: string): RenderedPage[] {
  const resolved = path.resolve(file)
  const entryNames = new Set<string>()

  for (const [name, asset] of state.clientEntryAssets.scripts) {
    if (path.resolve(asset.file) === resolved) entryNames.add(name)
  }
  for (const [name, asset] of state.clientEntryAssets.styles) {
    if (path.resolve(asset.file) === resolved) entryNames.add(name)
  }

  if (entryNames.size) {
    return pageList(state).filter((page) =>
      [...page.clientEntries, ...page.clientStyles].some((entry) =>
        entryNames.has(entry.name)
      )
    )
  }

  if (isSameOrInside(path.join(state.clientDir, 'modules'), resolved)) {
    const rel = toPosix(
      path.relative(path.join(state.clientDir, 'modules'), resolved)
    ).replace(/\.(?:ts|js)$/i, '')
    const specifier = `vanilla-press/client/modules/${rel}`
    return pageList(state).filter((page) =>
      pageUsesClientImport(page, (item) => item === specifier)
    )
  }

  if (isSameOrInside(state.clientDir, resolved)) {
    return pageList(state).filter((page) =>
      pageUsesClientImport(page, (item) => item === 'vanilla-press/client')
    )
  }

  return pageList(state)
}

function clientChangeIsStyleOnly(state: DevState, file: string): boolean {
  const resolved = path.resolve(file)
  return Array.from(state.clientEntryAssets.styles.values()).some(
    (asset) => path.resolve(asset.file) === resolved
  )
}

async function updatePages(
  state: DevState,
  pages: RenderedPage[],
  options: { global?: boolean; writeAll?: boolean } = {}
): Promise<{
  runtimeUpdates: AssetUpdate[]
  clientUpdates: AssetUpdate[]
  globalUpdates: AssetUpdate[]
}> {
  const clientUpdates = await rebuildClientAssets(state, pages)
  const runtimeUpdates = await rebuildRuntime(state)
  const globalUpdates =
    options.global === false ? [] : await writeGlobalOutputs(state)
  const htmlUpdates = [...runtimeUpdates, ...globalUpdates]

  await writeRenderedPageOutputs(state, pages)

  if (!options.writeAll && htmlUpdates.length) {
    await rewriteHtmlAssetsForUpdates(state, htmlUpdates)
  }

  if (options.writeAll || htmlUpdates.length)
    await writeDefaultEntrypoint(state)

  return { runtimeUpdates, clientUpdates, globalUpdates }
}

async function rebuildEverything(
  state: DevState,
  reason: string
): Promise<void> {
  console.warn(`dev: rebuild shell (${reason})`)
  await loadConfigState(state)
  state.sourceFiles = await loadAllSources(state.inputDir)
  await refreshMarkdownRenderer(state)
  await copyStaticAssets(state.assetsDir, state.publicDir)
  const styleUpdates = await rebuildStyle(state)
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
  const pages = await renderAllPages(state)
  await releaseMarkdownRenderer(state)
  await rebuildRuntime(state, true)
  await rebuildClientAssets(state, pages)
  await writeGlobalOutputs(state)
  await writeRenderedPageOutputs(state, pages)
  await writeDefaultEntrypoint(state)
  if (styleUpdates.length) {
    console.warn(`dev: updated ${styleUpdates.length} style asset(s)`)
  }
}

async function updateMarkdownFile(
  state: DevState,
  changedFile: string
): Promise<'reload' | 'style'> {
  const rel = toPosix(path.relative(state.inputDir, changedFile))
  const exists = await pathExists(changedFile)
  const previousRoot = state.hasRootIndex
  const previousSource = state.sourceFiles.get(rel)

  if (!exists) {
    state.sourceFiles.delete(rel)
    state.pages.delete(rel)
    await removePageCache(state, rel)
    await removeFileIfExists(
      path.join(
        state.outputDir,
        previousSource?.rel || rel.replace(/\.md$/i, '.html')
      )
    )
    await removeFileIfExists(
      path.join(
        state.outputDir,
        previousSource ? markdownRouteRel(previousSource) : rel
      )
    )
  } else {
    state.sourceFiles.set(rel, await loadSourceFile(state, rel))
  }

  const mdChanged = await refreshMarkdownRenderer(state)
  const nextRoot = sourceList(state).some(
    (source) => source.rel === 'index.html'
  )
  const structural = mdChanged || previousRoot !== nextRoot
  let pages: RenderedPage[] = []

  if (structural) {
    pages = await renderAllPages(state)
  } else if (exists) {
    pages = [await setPage(state, state.sourceFiles.get(rel) as SourcePage)]
  }
  await releaseMarkdownRenderer(state)

  await updatePages(state, pages, { writeAll: structural || !exists })
  console.warn(
    `dev: markdown ${exists ? 'updated' : 'removed'} ${rel}; rendered ${
      structural ? state.pages.size : pages.length
    } page(s)`
  )
  return 'reload'
}

async function updateClientFile(
  state: DevState,
  changedFile: string
): Promise<{ notify: 'reload' | 'style'; styleUpdates: AssetUpdate[] }> {
  const styleOnly = clientChangeIsStyleOnly(state, changedFile)
  const pages = pagesForClientFile(state, changedFile)
  state.clientEntryAssets = await scanClientEntryAssets(
    state.clientDir,
    state.config
  )
  const updates = await updatePages(state, pages, {
    global: false,
    writeAll: false,
  })
  console.warn(
    `dev: client asset updated ${toPosix(
      path.relative(workingRoot, changedFile)
    )}; rebuilt ${pages.length} page client graph(s)`
  )
  return {
    notify: styleOnly ? 'style' : 'reload',
    styleUpdates: updates.clientUpdates.filter((item) =>
      item.logical.endsWith('.css')
    ),
  }
}

async function updateStyleInputs(state: DevState): Promise<AssetUpdate[]> {
  const updates = await rebuildStyle(state)
  if (updates.length) {
    await rewriteHtmlAssetsForUpdates(state, updates)
    await writeDefaultEntrypoint(state)
  }
  console.warn(`dev: global style rebuilt (${updates.length} changed asset(s))`)
  return updates
}

async function updateRuntimeOnly(state: DevState): Promise<void> {
  const updates = await rebuildRuntime(state, true)
  if (updates.length) {
    await rewriteHtmlAssetsForUpdates(state, updates)
    await writeDefaultEntrypoint(state)
  }
  console.warn(`dev: runtime rebuilt (${updates.length} changed asset(s))`)
}

function isMarkdownChange(state: DevState, file: string): boolean {
  return isSameOrInside(state.inputDir, file) && /\.md$/i.test(file)
}

function isDirectorySidebarChange(state: DevState, file: string): boolean {
  return (
    isSameOrInside(state.inputDir, file) &&
    /(?:^|\/)sidebar\.(?:ts|js)$/i.test(toPosix(file))
  )
}

function isClientChange(state: DevState, file: string): boolean {
  return isSameOrInside(state.clientDir, file)
}

function isAssetChange(state: DevState, file: string): boolean {
  return isSameOrInside(state.assetsDir, file)
}

function isStyleSourceChange(file: string): boolean {
  const rel = toPosix(path.relative(packageRoot, file))
  return (
    rel === 'src/style.ts' ||
    rel === 'src/config/externalStyle.ts' ||
    rel.startsWith('src/theme-default/styles/')
  )
}

function isRuntimeSourceChange(file: string): boolean {
  const rel = toPosix(path.relative(packageRoot, file))
  return (
    rel === 'src/runtime.ts' ||
    rel.startsWith('src/runtime/') ||
    rel.startsWith('src/client') ||
    rel.startsWith('src/utilities/') ||
    rel.startsWith('src/config/icons')
  )
}

async function handleChange(
  state: DevState,
  server: DevServer,
  reason: string
): Promise<void> {
  const changedFile = path.resolve(workingRoot, reason)
  const start = performance.now()
  let notify: 'reload' | 'style' = 'reload'
  let styleUpdates: AssetUpdate[] = []

  try {
    if (isMarkdownChange(state, changedFile)) {
      notify = await updateMarkdownFile(state, changedFile)
    } else if (isClientChange(state, changedFile)) {
      const result = await updateClientFile(state, changedFile)
      notify = result.notify
      styleUpdates = result.styleUpdates
    } else if (isAssetChange(state, changedFile)) {
      await copyStaticAssets(state.assetsDir, state.publicDir)
      console.warn(`dev: static assets copied (${reason})`)
    } else if (isStyleSourceChange(changedFile)) {
      notify = 'style'
      styleUpdates = await updateStyleInputs(state)
    } else if (isRuntimeSourceChange(changedFile)) {
      await updateRuntimeOnly(state)
    } else if (
      isDirectorySidebarChange(state, changedFile) ||
      isSameOrInside(state.configDir, changedFile) ||
      isSameOrInside(state.layoutsDir, changedFile) ||
      isSameOrInside(state.componentsDir, changedFile)
    ) {
      await rebuildEverything(state, reason)
    } else if (isSameOrInside(packageRoot, changedFile)) {
      await rebuildEverything(state, reason)
    } else {
      await rebuildEverything(state, reason)
    }

    if (notify === 'style' && styleUpdates.length) server.style(styleUpdates)
    else server.reload()
  } catch (error) {
    console.error(error)
  } finally {
    console.warn(
      green(
        `dev: ${reason} complete in ${Math.round(performance.now() - start)}ms`
      )
    )
    console.warn(green(devServerMemoryMessage()))
  }
}

function createBuildRunner(
  state: DevState,
  server: DevServer
): (reason: string) => void {
  let building = false
  const queue = new Set<string>()

  async function drain(): Promise<void> {
    if (building) return
    building = true

    try {
      while (queue.size) {
        const reasons = Array.from(queue)
        queue.clear()

        for (const reason of reasons) {
          await handleChange(state, server, reason)
        }
      }
    } finally {
      building = false
    }
  }

  return (reason) => {
    queue.add(reason)
    void drain()
  }
}

function createDebouncedRebuild(rebuild: (reason: string) => void) {
  let timer: NodeJS.Timeout | null = null
  const reasons = new Set<string>()

  return (reason: string): void => {
    reasons.add(reason)
    if (timer) clearTimeout(timer)

    timer = setTimeout(() => {
      timer = null
      const batch = Array.from(reasons)
      reasons.clear()
      for (const item of batch) rebuild(item)
    }, 80)
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

function resolveBuildOptions({
  inputDir = defaultInputDir,
  outputDir = defaultOutputDir,
  assetsDir = defaultAssetsDir,
  configDir = defaultConfigDir,
  cacheDir,
  layoutsDir = defaultLayoutsDir,
  componentsDir = defaultComponentsDir,
}: BuildOptions): ResolvedBuildOptions {
  const resolvedConfigDir = resolveDir(configDir, defaultConfigDir)

  return {
    inputDir: resolveDir(inputDir, defaultInputDir),
    outputDir: resolveDir(outputDir, defaultOutputDir),
    assetsDir: resolveDir(assetsDir, defaultAssetsDir),
    configDir: resolvedConfigDir,
    cacheDir: cacheDir
      ? resolveDir(
          cacheDir,
          path.join(path.dirname(resolvedConfigDir), 'cache')
        )
      : path.join(path.dirname(resolvedConfigDir), 'cache'),
    layoutsDir: resolveDir(layoutsDir, defaultLayoutsDir),
    componentsDir: resolveDir(componentsDir, defaultComponentsDir),
  }
}

export async function dev({
  host = '127.0.0.1',
  port = 3333,
  ...rawOptions
}: DevOptions = {}): Promise<void> {
  const buildOptions = resolveBuildOptions(rawOptions)
  const version = await loadPackageVersion()
  const devPort = await findAvailablePort(host, port)
  const devServer = createDevServer(buildOptions.outputDir)
  const address = `http://${host}:${devPort}/`

  await new Promise<void>((resolve, reject) => {
    devServer.server.once('error', reject)
    devServer.server.listen(devPort, host, () => resolve())
  })

  clearScreen()
  console.warn(green(devServerStartMessage(version)))
  const start = performance.now()
  const state = await createInitialState(buildOptions)
  console.warn(
    green(
      `dev: initial graph ready in ${Math.round(performance.now() - start)}ms`
    )
  )
  console.warn(green(devServerMemoryMessage()))
  console.warn(green(devServerAddressMessage(version, address)))

  const rebuild = createBuildRunner(state, devServer)
  const debouncedRebuild = createDebouncedRebuild(rebuild)
  const closeWatchers = await watchProject(
    [
      buildOptions.inputDir,
      buildOptions.assetsDir,
      buildOptions.configDir,
      buildOptions.layoutsDir,
      buildOptions.componentsDir,
      state.clientDir,
      path.join(packageRoot, 'src'),
    ],
    [buildOptions.outputDir],
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
