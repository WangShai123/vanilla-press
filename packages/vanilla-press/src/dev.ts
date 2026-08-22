import { createReadStream, watch, type FSWatcher } from 'fs'
import fs from 'fs/promises'
import http, { type ServerResponse } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

import { build as esbuildBuild } from 'esbuild'
import { glob } from 'glob'

import {
  buildComponentScripts,
  buildCss,
  buildRuntime,
  buildLayoutScripts,
  copyStaticAssets,
  loadFooterScript,
  loadLastEditCache,
  loadLanguages,
  loadLlmsConfig,
  loadMenuItems,
  loadRobotsConfig,
  loadRuntimeConfig,
  loadSidebarItems,
  pageSharedVpModules,
  readSource,
  renderSource,
  resolveI18nData,
  ensureSourceConfig,
  writeDefaultLocaleEntrypoint,
  writeLastEditCache,
  writeRobots,
  writeSearchIndex,
  writeSitemap,
} from './build.ts'
import { createMarkdown } from './core/md.ts'
import { loadLayouts } from './render/layout.ts'
import type {
  BuildOptions,
  BuildReportState,
  FooterScriptConfig,
  LayoutMap,
  LoadedMarkdownComponent,
  ModuleScriptAsset,
  RenderedPage,
  RuntimeConfig,
  SharedVpScriptModule,
  SourcePage,
  UnknownRecord,
} from './types.ts'
import { loadCustomComponents } from './utilities/components.ts'
import { assertEditorSizeConfig } from './utilities/editor-size.ts'
import {
  buildOption,
  isI18nEnabled,
  isLlmsEnabled,
  isMenuEnabled,
  isRobotsEnabled,
  isSearchEnabled,
  isSidebarEnabled,
  isSitemapEnabled,
} from './utilities/features.ts'
import { markdownRouteRel, renderLlmsTxt } from './utilities/llms.ts'
import { excerptText } from './utilities/page.ts'
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
const EVENTS_PATH = `${DEV_PREFIX}events`

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
  cacheDir: string
  publicDir: string
  config: RuntimeConfig
  footerScript: FooterScriptConfig
  languages: ReturnType<typeof resolveI18nData>
  menuItems: unknown[]
  sidebarItems: unknown[]
  llmsConfig: UnknownRecord
  robotsConfig: UnknownRecord
  layouts: LayoutMap
  customComponents: LoadedMarkdownComponent[]
  md: ReturnType<typeof createMarkdown>
  lastEditCache: LastEditCache
  sourcesByFile: Map<string, SourcePage>
  pagesByFile: Map<string, RenderedPage>
  componentScriptAssets: Map<string, ModuleScriptAsset>
  layoutScriptAssets: Map<string, ModuleScriptAsset>
  sharedVpModules: SharedVpScriptModule[]
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

async function writePageScriptsForPage(
  outputDir: string,
  page: RenderedPage
): Promise<string[]> {
  const written: string[] = []

  for (const script of page.scripts || []) {
    const outputFile = path.join(outputDir, script.rel)
    const result = await esbuildBuild({
      bundle: true,
      format: 'esm',
      legalComments: 'none',
      minify: false,
      platform: 'browser',
      target: 'es2020',
      write: false,
      external: ['vanilla-press/runtime'],
      stdin: {
        contents: script.code,
        loader: 'js',
        resolveDir: workingRoot,
        sourcefile: script.rel,
      },
    })
    const output = result.outputFiles?.[0]?.text || script.code
    if (await writeTextIfChanged(outputFile, output)) {
      written.push(outputFile)
    }
  }

  return written
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
  return `const source = new EventSource(${JSON.stringify(EVENTS_PATH)});
const close = () => source.close();
window.addEventListener('pagehide', close, { once: true });
window.addEventListener('beforeunload', close, { once: true });
source.addEventListener('reload', () => {
  close();
  location.reload();
});
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
  const clients = new Set<ServerResponse>()
  const removeClient = (client: ServerResponse): void => {
    clients.delete(client)
  }

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

    if (url.pathname === EVENTS_PATH) {
      res.writeHead(200, {
        'Cache-Control': 'no-store',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
      })
      res.write(': connected\n\n')
      clients.add(res)
      const cleanup = () => removeClient(res)
      req.on('close', cleanup)
      req.on('aborted', cleanup)
      res.on('close', cleanup)
      res.on('error', cleanup)
      return
    }

    serveStatic(outputDir, req, res).catch((error) => {
      console.error(error)
      send(res, 500, 'Internal server error')
    })
  })

  return {
    server,
    reload() {
      for (const client of clients) {
        if (client.destroyed || client.writableEnded) {
          clients.delete(client)
          continue
        }

        try {
          client.write('event: reload\ndata: ok\n\n')
        } catch {
          clients.delete(client)
        }
      }
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

function collectSearchIndex(pages: RenderedPage[]): string {
  const items = pages.map((page) => ({
    title: page.seo?.title || page.title,
    rel: page.rel,
    keywords: page.seo?.keywords || '',
    description: page.seo?.description || '',
    excerpt: excerptText(page.seo?.description || page.content),
    content: page.content,
  }))

  return `export const searchIndex = ${JSON.stringify(items)};\n`
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
  const cacheDir =
    options.cacheDir || path.join(path.dirname(configDir), 'cache')
  const publicDir = path.join(outputDir, 'public')

  await fs.mkdir(inputDir, { recursive: true })
  await fs.mkdir(assetsDir, { recursive: true })
  await fs.mkdir(layoutsDir, { recursive: true })
  await fs.mkdir(componentsDir, { recursive: true })
  await ensureSourceConfig(configDir)

  const config = await loadRuntimeConfig(configDir)
  validateRuntimeConfig(config)
  const footerScript = await loadFooterScript(configDir)
  const customComponents = await loadCustomComponents(componentsDir)
  const md = createMarkdown(config, customComponents)
  const layouts = await loadLayouts({ packageRoot, layoutsDir })
  const languages = isI18nEnabled(config)
    ? resolveI18nData(config, await loadLanguages(configDir))
    : {}
  const menuItems = isMenuEnabled(config) ? await loadMenuItems(configDir) : []
  const sidebarItems = isSidebarEnabled(config)
    ? await loadSidebarItems(configDir)
    : []
  const llmsConfig = isLlmsEnabled(config)
    ? await loadLlmsConfig(configDir)
    : {}
  const robotsConfig = isRobotsEnabled(config)
    ? await loadRobotsConfig(configDir)
    : {}
  const lastEditCache = buildOption(config, 'lastEdit')
    ? await loadLastEditCache(cacheDir)
    : {}

  return {
    inputDir,
    outputDir,
    assetsDir,
    configDir,
    layoutsDir,
    componentsDir,
    cacheDir,
    publicDir,
    config,
    footerScript,
    languages,
    menuItems,
    sidebarItems,
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
    sharedVpModules: [],
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

async function syncPageOutputs(
  state: DevState,
  page: RenderedPage,
  previousPage: RenderedPage | null
): Promise<string[]> {
  const changed: string[] = []

  if (previousPage) {
    const nextScripts = new Set((page.scripts || []).map((item) => item.rel))
    for (const script of previousPage.scripts || []) {
      if (nextScripts.has(script.rel)) continue
      const file = path.join(state.outputDir, script.rel)
      if (await removeFileIfExists(file)) changed.push(file)
    }
  }

  const scriptChanges = await writePageScriptsForPage(state.outputDir, page)
  changed.push(...scriptChanges)

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

  for (const script of page.scripts || []) {
    targets.add(path.join(state.outputDir, script.rel))
  }

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
  const sharedModules = pageSharedVpModules(pages)
  const runtimeChanged =
    forceRuntime ||
    sharedModules.length !== state.sharedVpModules.length ||
    sharedModules.some((item, index) => item !== state.sharedVpModules[index])

  if (runtimeChanged) {
    await buildRuntime(state.publicDir, {
      config: state.config,
      languages: state.languages,
      menuItems: state.menuItems,
      sidebarItems: state.sidebarItems,
      sharedVpModules: sharedModules,
    })
    state.sharedVpModules = sharedModules
    changed.push(path.join(state.publicDir, 'runtime.js'))
  }

  if (isSearchEnabled(state.config)) {
    const file = path.join(state.publicDir, 'search.js')
    if (await writeTextIfChanged(file, collectSearchIndex(pages))) {
      changed.push(file)
    }
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

  await fs.rm(state.outputDir, { force: true, recursive: true })
  await fs.mkdir(state.outputDir, { recursive: true })
  await fs.mkdir(state.publicDir, { recursive: true })

  if (buildOption(state.config, 'lastEdit')) {
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
    state.layouts
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
      state.layouts,
      state.componentScriptAssets,
      state.layoutScriptAssets,
      state.llmsConfig,
      state.footerScript,
      state.lastEditCache,
      state.hasRootIndex
    )
    state.pagesByFile.set(source.file, page)
  }

  const pages = collectPages(state)
  state.sharedVpModules = pageSharedVpModules(pages)

  await buildRuntime(state.publicDir, {
    config: state.config,
    languages: state.languages,
    menuItems: state.menuItems,
    sidebarItems: state.sidebarItems,
    sharedVpModules: state.sharedVpModules,
  })

  if (isSearchEnabled(state.config)) {
    await writeSearchIndex(state.publicDir, pages)
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

  if (buildOption(state.config, 'lastEdit')) {
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
      if (buildOption(state.config, 'lastEdit')) {
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
    state.layouts,
    state.componentScriptAssets,
    state.layoutScriptAssets,
    state.llmsConfig,
    state.footerScript,
    state.lastEditCache,
    state.hasRootIndex
  )
  state.pagesByFile.set(source.file, page)

  const changed = await syncPageOutputs(state, page, previousPage)
  if (buildOption(state.config, 'lastEdit')) {
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
      path.join(packageRoot, 'src'),
    ],
    [state.outputDir],
    debouncedRebuild
  )

  const close = async () => {
    await closeWatchers()
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
