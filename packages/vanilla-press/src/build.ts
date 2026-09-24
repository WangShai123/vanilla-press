import { createHash } from 'crypto'
import fs from 'fs/promises'
import { createRequire } from 'module'
import os from 'os'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

import { build as esbuildBuild, transform as esbuildTransform } from 'esbuild'
import { glob } from 'glob'
import { randomId } from 'vanilla-jui'

import {
  DEFAULT_CONFIG_TS,
  DEFAULT_FOOTER_SCRIPT_TS,
  DEFAULT_LANGUAGES_TS,
  DEFAULT_LLMS_CONFIG,
  DEFAULT_LLMS_TS,
  DEFAULT_MENU_TS,
  DEFAULT_ROBOTS_CONFIG,
  DEFAULT_ROBOTS_TS,
  DEFAULT_SIDEBAR_TS,
} from './config/defaults.ts'
import { createMarkdown } from './markdown/md.ts'
import { renderDefaultLocaleEntrypoint, renderHtml } from './render/html.ts'
import { layoutStyles, loadLayouts, renderLayout } from './render/layout.ts'
import { renderTreeNav } from './render/template/navigation.ts'
import { createDocI18n, currentLocale } from './runtime/i18n.ts'
import type {
  BuildOptions,
  BuildReportState,
  RuntimeConfig,
  FooterScriptConfig,
  FrontmatterData,
  LanguagesConfig,
  LayoutMap,
  LoadedMarkdownComponent,
  ModuleScriptAsset,
  NavItem,
  RenderedPage,
  RuntimeSidebarConfig,
  RuntimeSidebar,
  RuntimeBundleData,
  RuntimeI18nConfig,
  SeoData,
  ClientImport,
  ClientEntryAssets,
  ServerClientConfig,
  SharedClientModule,
  SourcePage,
  StylesheetAsset,
  UnknownRecord,
} from './types.ts'
import { isRecord } from './types.ts'
import { loadCustomComponents } from './utilities/components.ts'
import { assertEditorSizeConfig } from './utilities/editor-size.ts'
import {
  DEFAULT_LAST_EDIT_FORMAT,
  formatLastEditDate,
  renderEditorHelp,
} from './utilities/editor.ts'
import { renderExternalLinks } from './utilities/external-link.ts'
import {
  isAuthEnabled,
  serverOption,
  isI18nEnabled,
  isLlmsEnabled,
  isRobotsEnabled,
  isSitemapEnabled,
  isSearchEnabled,
  isThemeEnabled,
  isTocEnabled,
} from './utilities/features.ts'
import {
  parseFrontmatter,
  pickSeoFrontmatter,
} from './utilities/frontmatter.ts'
import {
  cleanHtml,
  htmlText,
  transformComponentTags,
} from './utilities/html.ts'
import {
  defaultLocaleRoute,
  localeRouteEntries,
  normalizeLocaleRoute,
} from './utilities/i18n-routes.ts'
import {
  injectLlmsControls,
  markdownRouteRel,
  renderLlmsTxt,
} from './utilities/llms.ts'
import { excerptText, pageTitle } from './utilities/page.ts'
import {
  normalizePath,
  relativeAsset,
  resolveDir,
  stripMdExt,
  toPosix,
} from './utilities/path.ts'
import { renderPrevNext } from './utilities/prev-next.ts'
import { renderRobotsTxt } from './utilities/robots.ts'
import {
  pageInSearchLocale,
  searchIndexFileName,
  searchLocaleRoutes,
} from './utilities/search.ts'
import { resolvePageSidebarItems } from './utilities/sidebar.ts'
import { minifyCss, readStyleConfig } from './utilities/style.ts'

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
const require = createRequire(import.meta.url)

interface DefaultModule<T> {
  default?: T
}

interface SearchIndexItem {
  title: string
  rel: string
  keywords: string
  description: string
  excerpt: string
  content: string
}

interface ClientEntryFiles {
  scripts: Map<string, string>
  styles: Map<string, string>
}

type MarkdownItInstance = Awaited<ReturnType<typeof createMarkdown>>

const SHARED_CLIENT_MODULES = [
  'vanilla-jui',
  'vanilla-signal',
  'vanilla-create-storage',
  'vanilla-signal-i18n',
] satisfies SharedClientModule[]
const SHARED_CLIENT_RUNTIME_ID = 'vanilla-press/runtime'
const CLIENT_RUNTIME_ID = 'vanilla-press/client'
const CLIENT_MODULE_PREFIX = 'vanilla-press/client/modules/'
const IMPORT_STATEMENT_RE =
  /^(\s*)import\s+(?:(.*?)\s+from\s+)?(['"])([^'"]+)\3\s*;?/gms
const CODE_FENCE_RE = /(?:^|\n)[ \t]{0,3}(`{3,}|~{3,})[ \t]*([^\n]*)/g

async function pathExists(file: string): Promise<boolean> {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

async function importDefault<T>(file: string, fallback: T): Promise<T> {
  const mod = (await import(
    `${pathToFileURL(file).href}?t=${Date.now()}`
  )) as DefaultModule<T>
  return (mod.default || fallback) as T
}

async function resolveSourceModule(
  sourceDir: string,
  basename: string
): Promise<string | null> {
  const tsFile = path.join(sourceDir, `${basename}.ts`)
  if (await pathExists(tsFile)) return tsFile

  const jsFile = path.join(sourceDir, `${basename}.js`)
  if (await pathExists(jsFile)) return jsFile

  return null
}

export async function ensureSourceConfig(configDir: string): Promise<void> {
  const files = [
    ['runtime', DEFAULT_CONFIG_TS],
    ['footerScript', DEFAULT_FOOTER_SCRIPT_TS],
    ['languages', DEFAULT_LANGUAGES_TS],
    ['llms', DEFAULT_LLMS_TS],
    ['menu', DEFAULT_MENU_TS],
    ['robots', DEFAULT_ROBOTS_TS],
    ['sidebar', DEFAULT_SIDEBAR_TS],
  ]

  await fs.mkdir(configDir, { recursive: true })

  for (const [basename, content] of files) {
    if (await resolveSourceModule(configDir, basename)) continue

    await fs.writeFile(path.join(configDir, `${basename}.ts`), content, 'utf8')
  }
}

export async function loadRuntimeConfig(
  configDir: string
): Promise<RuntimeConfig> {
  const file = await resolveSourceModule(configDir, 'runtime')
  if (!file) return {}

  return importDefault<RuntimeConfig>(file, {})
}

export async function loadClientRuntimeFile(
  clientDir: string
): Promise<string | null> {
  return resolveSourceModule(clientDir, 'runtime')
}

export async function loadFooterScript(
  configDir: string
): Promise<FooterScriptConfig> {
  const file = await resolveSourceModule(configDir, 'footerScript')
  if (!file) return ''

  return importDefault<FooterScriptConfig>(file, '')
}

export async function loadRobotsConfig(
  configDir: string
): Promise<UnknownRecord> {
  const file = await resolveSourceModule(configDir, 'robots')
  if (!file) return DEFAULT_ROBOTS_CONFIG as UnknownRecord

  return importDefault<UnknownRecord>(
    file,
    DEFAULT_ROBOTS_CONFIG as UnknownRecord
  )
}

export async function loadLlmsConfig(
  configDir: string
): Promise<UnknownRecord> {
  const file = await resolveSourceModule(configDir, 'llms')
  if (!file) return DEFAULT_LLMS_CONFIG as UnknownRecord

  return importDefault<UnknownRecord>(
    file,
    DEFAULT_LLMS_CONFIG as UnknownRecord
  )
}

function validateRuntimeConfig(config: RuntimeConfig = {}): void {
  assertEditorSizeConfig(config)

  const siteUrl = String(config.siteUrl || '').trim()

  if (!siteUrl) {
    throw new Error(
      'siteUrl is required. Add siteUrl: "https://your-domain.com" to vp/config/runtime.ts.'
    )
  }

  let url
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

export async function loadLanguages(
  configDir: string
): Promise<LanguagesConfig> {
  const file = await resolveSourceModule(configDir, 'languages')
  if (!file) return {}

  return importDefault<LanguagesConfig>(file, {})
}

export function resolveI18nData(
  config: RuntimeConfig = {},
  messages: LanguagesConfig = {}
): LanguagesConfig {
  const i18n = (serverOption(config, 'i18n') || {}) as RuntimeI18nConfig
  const i18nMessages = messages && typeof messages === 'object' ? messages : {}

  return {
    locale: i18n.locale || 'zh-CN',
    fallbackLocale: i18n.fallbackLocale || 'en',
    locales: Array.isArray(i18n.locales) ? i18n.locales : [],
    messages: i18nMessages,
  }
}

export async function loadMenuItems(configDir: string): Promise<unknown[]> {
  const file = await resolveSourceModule(configDir, 'menu')
  if (!file) return []

  return importDefault<unknown[]>(file, [])
}

export async function loadSidebarItems(configDir: string): Promise<unknown[]> {
  const file = await resolveSourceModule(configDir, 'sidebar')
  if (!file) return []

  return importDefault<unknown[]>(file, [])
}

function normalizeSidebarDir(file: string): string {
  const dir = toPosix(path.dirname(file))
  return dir === '.' ? '' : dir.replace(/^\/+|\/+$/g, '')
}

export async function loadDirectorySidebarItems(
  inputDir: string
): Promise<RuntimeSidebarConfig['directories']> {
  const files = (
    await glob('**/sidebar.{ts,js}', {
      cwd: inputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort()

  const directories = await Promise.all(
    files.map(async (file) => {
      const dir = normalizeSidebarDir(file)
      if (!dir) return null

      const items = await importDefault<RuntimeSidebarConfig['items']>(
        path.join(inputDir, file),
        []
      )

      return { dir, items }
    })
  )

  return directories
    .filter((item): item is RuntimeSidebarConfig['directories'][number] =>
      Boolean(item)
    )
    .sort((a, b) => a.dir.localeCompare(b.dir))
}

export function createRuntimeSidebarConfig(
  items: unknown[] = [],
  directories: RuntimeSidebarConfig['directories'] = []
): RuntimeSidebar {
  return directories.length
    ? { items: items as RuntimeSidebarConfig['items'], directories }
    : (items as RuntimeSidebar)
}

interface LastEditCacheEntry {
  hash: string
  at: string
}

type LastEditCache = Record<string, LastEditCacheEntry>

const LAST_EDIT_CACHE_FILE = '.last-edit.json'

function sourceHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 8)
}

function logIfChanged(
  reportState: BuildReportState | undefined,
  log: (message: string) => void,
  key: string,
  value: string,
  message: string
): boolean {
  if (!reportState) {
    log(message)
    return true
  }

  const hash = sourceHash(value)
  const previous = reportState.hashes.get(key)
  reportState.hashes.set(key, hash)

  if (previous !== hash) {
    log(message)
    return true
  }

  return false
}

export async function loadLastEditCache(
  cacheDir: string
): Promise<LastEditCache> {
  const file = path.join(cacheDir, LAST_EDIT_CACHE_FILE)
  try {
    const text = await fs.readFile(file, 'utf8')
    const parsed = JSON.parse(text) as LastEditCache
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export async function writeLastEditCache(
  cacheDir: string,
  cache: LastEditCache
): Promise<void> {
  const file = path.join(cacheDir, LAST_EDIT_CACHE_FILE)
  await fs.writeFile(file, `${JSON.stringify(cache, null, 2)}\n`, 'utf8')
}

function lastEditSettings(config: RuntimeConfig = {}): {
  format: string
  utc: boolean
} {
  const lastEdit = serverOption(config, 'lastEdit')
  if (!lastEdit || lastEdit === false || lastEdit === true) {
    return { format: DEFAULT_LAST_EDIT_FORMAT, utc: true }
  }

  const record = isRecord(lastEdit) ? (lastEdit as UnknownRecord) : {}
  const format =
    typeof record.format === 'string' && record.format.trim()
      ? record.format.trim()
      : DEFAULT_LAST_EDIT_FORMAT
  const utc = typeof record.utc === 'boolean' ? record.utc : true
  return { format, utc }
}

function resolveLastEditText(
  source: SourcePage,
  config: RuntimeConfig = {},
  cache: LastEditCache = {}
): string {
  const lastEdit = serverOption(config, 'lastEdit')
  if (!lastEdit || lastEdit === false) return ''

  const currentHash = sourceHash(source.markdown)
  const cached = cache[source.rel]
  const { format, utc } = lastEditSettings(config)
  if (cached && cached.hash === currentHash && cached.at) {
    return formatLastEditDate(cached.at, format, utc)
  }

  const at = new Date().toISOString()
  const value = formatLastEditDate(at, format, utc)
  cache[source.rel] = {
    hash: currentHash,
    at,
  }
  return value
}

function resolveDefaultLocale(
  config: RuntimeConfig = {},
  languages: LanguagesConfig = {}
) {
  const locales = Array.isArray(languages.locales) ? languages.locales : []
  if (!locales.length) return null

  const i18n = serverOption(config, 'i18n') as RuntimeI18nConfig | undefined
  const preferred = String(i18n?.locale || languages.locale || '')
    .trim()
    .toLowerCase()
  return (
    locales.find(
      (locale) =>
        String(locale.code || '')
          .trim()
          .toLowerCase() === preferred
    ) || locales[0]
  )
}

export async function writeDefaultLocaleEntrypoint(
  outputDir: string,
  config: RuntimeConfig = {},
  languages: LanguagesConfig = {},
  pages: RenderedPage[] = [],
  footerScript: FooterScriptConfig = '',
  reportState?: BuildReportState,
  log: (message: string) => void = console.warn,
  label = 'built'
): Promise<boolean> {
  if (!isI18nEnabled(config)) return false
  const i18n = serverOption(config, 'i18n') as RuntimeI18nConfig | undefined
  if (i18n?.redirectToDefault === false) return false
  if (pages.some((page) => page.rel === 'index.html')) return false

  const locale = resolveDefaultLocale(config, languages)
  const prefix = normalizePath(locale?.path)
  if (prefix) {
    const target = `${prefix}/index.html`
    const hasTarget = pages.some((page) => page.rel === target)
    if (!hasTarget) return false
  }

  const rootIndexFile = path.join(outputDir, 'index.html')
  const rootLang =
    String(locale?.code || i18n?.locale || languages.locale || 'en').trim() ||
    'en'
  const html = renderDefaultLocaleEntrypoint({
    i18n,
    languages,
    lang: rootLang,
    config,
    footerScript,
  })

  await fs.writeFile(rootIndexFile, html, 'utf8')
  return logIfChanged(
    reportState,
    log,
    rootIndexFile,
    html,
    `${label}: ${toPosix(path.relative(workingRoot, rootIndexFile))}`
  )
}

export async function buildCss(
  outputDir: string,
  layouts: LayoutMap
): Promise<void> {
  const configuredCss = await readStyleConfig(
    path.join(packageRoot, 'src/config/externalStyle.ts')
  )
  const customCss = await readStyleConfig(
    path.join(packageRoot, 'src/style.ts')
  )
  const styles = [...configuredCss, ...customCss, ...layoutStyles(layouts)]
  const css = await minifyCss(styles.join('\n\n'))

  await fs.writeFile(path.join(outputDir, 'styles.css'), css, 'utf8')
}

export async function copyStaticAssets(
  assetsDir: string,
  publicDir: string
): Promise<void> {
  if (!(await pathExists(assetsDir))) return

  await fs.mkdir(publicDir, { recursive: true })
  const entries = await fs.readdir(assetsDir, { withFileTypes: true })

  await Promise.all(
    entries.map(async (entry) => {
      if (entry.name === '.DS_Store') return

      const source = path.join(assetsDir, entry.name)
      const target = path.join(publicDir, entry.name)

      if (entry.isDirectory()) {
        await copyStaticAssets(source, target)
        return
      }

      if (!entry.isFile()) return

      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.copyFile(source, target)
    })
  )
}

function serializeRuntimeValue(value: unknown): string {
  const serialized = JSON.stringify(value)
  return serialized === undefined ? 'undefined' : serialized
}

function runtimeSharedClientExports(
  modules: SharedClientModule[] = []
): string {
  return Array.from(new Set(modules))
    .sort()
    .map(
      (moduleName) =>
        `export * as ${sharedClientExportName(moduleName)} from ${JSON.stringify(require.resolve(moduleName))};`
    )
    .join('\n')
}

async function writeRuntimeEntry(
  dir: string,
  data: RuntimeBundleData = {}
): Promise<string> {
  const runtimeFile = path.join(packageRoot, 'src/runtime.ts')
  const sharedExports = runtimeSharedClientExports(data.sharedClientModules)
  const code = `import { initDocPage } from ${JSON.stringify(runtimeFile)};
export { initDocPage };
export const runtimeConfig = ${serializeRuntimeValue(data.config)};
export const languages = ${serializeRuntimeValue(data.languages || {})};
export const menuItems = ${serializeRuntimeValue(data.menuItems || [])};
export const sidebarItems = ${serializeRuntimeValue(data.sidebarItems || [])};
${sharedExports ? `${sharedExports}\n` : ''}
`
  const file = path.join(dir, 'runtime-entry.js')
  await fs.writeFile(file, code, 'utf8')
  return file
}

export async function buildRuntime(
  outputDir: string,
  data: RuntimeBundleData = {}
): Promise<void> {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'vanilla-press-runtime-')
  )

  try {
    const entry = await writeRuntimeEntry(tempDir, data)

    await esbuildBuild({
      bundle: true,
      entryPoints: [entry],
      format: 'esm',
      legalComments: 'none',
      outfile: path.join(outputDir, 'runtime.js'),
      platform: 'browser',
      sourcemap: false,
      target: 'es2020',
    })
  } finally {
    await fs.rm(tempDir, { force: true, recursive: true })
  }
}

function hashFileName(fileName: string): string {
  const ext = path.extname(fileName)
  const baseName = path.basename(fileName, ext)
  return `${baseName}.${randomId(8)}${ext}`
}

function contentHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 8)
}

function publicAssetRel(file: string): string {
  const rel = toPosix(file)
    .replace(/^\/+/, '')
    .replace(/^public\//, '')
  return `public/${rel}`
}

function moduleScriptRel(name: string, code: string): string {
  return publicAssetRel(`${name}.${contentHash(code)}.js`)
}

function safeClientSubpath(value: string): string {
  const clean = toPosix(value)
    .replace(/^\.\//, '')
    .replace(/\.(?:ts|js|css)$/i, '')
    .replace(/^\/+/, '')
    .trim()
  if (!clean || clean.split('/').some((part) => part === '..')) {
    throw new Error(`Invalid client module path "${value}".`)
  }
  return clean
}

function clientRuntimeRel(): string {
  return 'public/client/runtime.js'
}

function clientModuleRel(specifier: string): string {
  const name = safeClientSubpath(specifier.slice(CLIENT_MODULE_PREFIX.length))
  return `public/client/modules/${name}.js`
}

function clientEntryScriptRel(name: string): string {
  return `public/client/entries/${safeClientSubpath(name)}.js`
}

function clientEntryStyleRel(name: string): string {
  return `public/client/entries/${safeClientSubpath(name)}.css`
}

function isClientModuleSpecifier(value: string): boolean {
  return value.startsWith(CLIENT_MODULE_PREFIX)
}

function toClientImport(specifier: string): ClientImport | null {
  if (specifier === CLIENT_RUNTIME_ID) {
    return { specifier, type: 'runtime' }
  }
  if (isClientModuleSpecifier(specifier)) {
    return { specifier, type: 'module' }
  }
  return null
}

function collectClientImports(code: string): ClientImport[] {
  const imports = new Map<string, ClientImport>()

  code.replace(
    IMPORT_STATEMENT_RE,
    (statement, _indent, rawClause, _quote, source) => {
      const clause = String(rawClause || '').trim()
      if (clause.startsWith('type ')) return statement

      const item = toClientImport(String(source || ''))
      if (item) imports.set(item.specifier, item)
      return statement
    }
  )

  return Array.from(imports.values()).sort((a, b) =>
    a.specifier.localeCompare(b.specifier)
  )
}

function mergeClientImports(imports: ClientImport[] = []): ClientImport[] {
  return Array.from(
    new Map(imports.map((item) => [item.specifier, item])).values()
  ).sort((a, b) => a.specifier.localeCompare(b.specifier))
}

function clientImportMap(
  rel: string,
  imports: ClientImport[] = []
): Record<string, string> {
  const map: Record<string, string> = {}

  for (const item of mergeClientImports(imports)) {
    if (item.type === 'runtime') {
      map[item.specifier] = relativeAsset(rel, clientRuntimeRel())
    } else if (item.type === 'module') {
      map[item.specifier] = relativeAsset(rel, clientModuleRel(item.specifier))
    }
  }

  return map
}

async function resolveClientModuleFile(
  clientDir: string,
  specifier: string
): Promise<string> {
  const name = safeClientSubpath(specifier.slice(CLIENT_MODULE_PREFIX.length))
  const file = await resolveSourceModule(path.join(clientDir, 'modules'), name)
  if (!file) {
    throw new Error(
      `Missing client module "${specifier}". Add vp/client/modules/${name}.ts or .js.`
    )
  }
  return file
}

async function bundleClientFile(
  outputDir: string,
  rel: string,
  file: string,
  code?: string
): Promise<void> {
  const loader = path.extname(file).toLowerCase() === '.ts' ? 'ts' : 'js'
  const result = await esbuildBuild({
    bundle: true,
    external: [
      SHARED_CLIENT_RUNTIME_ID,
      CLIENT_RUNTIME_ID,
      `${CLIENT_MODULE_PREFIX}*`,
    ],
    format: 'esm',
    legalComments: 'none',
    minify: true,
    platform: 'browser',
    target: 'es2020',
    stdin: {
      contents: code ?? (await fs.readFile(file, 'utf8')),
      loader,
      resolveDir: path.dirname(file),
      sourcefile: file,
    },
    write: false,
  })
  const output = result.outputFiles?.[0]?.text || ''
  const outputFile = path.join(outputDir, rel)
  await fs.mkdir(path.dirname(outputFile), { recursive: true })
  await fs.writeFile(outputFile, output, 'utf8')
}

function configuredClientEntries(config: RuntimeConfig = {}): ClientEntryFiles {
  const client = serverOption(config, 'client') as
    | ServerClientConfig
    | undefined
  const entries = isRecord(client?.entries) ? client.entries : {}
  const result: ClientEntryFiles = {
    scripts: new Map<string, string>(),
    styles: new Map<string, string>(),
  }

  for (const [name, file] of Object.entries(entries)) {
    const cleanName = safeClientSubpath(name)
    const entryFiles = Array.isArray(file) ? file : [file]

    for (const item of entryFiles) {
      if (typeof item !== 'string' || !item.trim()) continue

      const entryFile = path.isAbsolute(item)
        ? item
        : path.resolve(workingRoot, item)
      if (path.extname(entryFile).toLowerCase() === '.css') {
        result.styles.set(cleanName, entryFile)
      } else {
        result.scripts.set(cleanName, entryFile)
      }
    }
  }

  return result
}

async function loadClientEntryFiles(
  clientDir: string,
  config: RuntimeConfig = {}
): Promise<ClientEntryFiles> {
  const entries = configuredClientEntries(config)
  const entriesDir = path.join(clientDir, 'entries')
  const files = await glob('**/*.{ts,js,css}', {
    cwd: entriesDir,
    nodir: true,
    windowsPathsNoEscape: true,
  }).catch(() => [])

  for (const file of files.sort((a, b) => a.localeCompare(b))) {
    const name = safeClientSubpath(file)
    const entryFile = path.join(entriesDir, file)
    if (path.extname(file).toLowerCase() === '.css') {
      if (!entries.styles.has(name)) entries.styles.set(name, entryFile)
    } else if (!entries.scripts.has(name)) {
      entries.scripts.set(name, entryFile)
    }
  }

  return entries
}

function pageClientEntryNames(source: SourcePage): string[] {
  const value = source.frontmatter.client
  const entries = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? [value]
      : isRecord(value)
        ? Array.isArray(value.entry)
          ? value.entry
          : typeof value.entry === 'string'
            ? [value.entry]
            : []
        : []

  return Array.from(
    new Set(
      entries
        .filter((item): item is string => typeof item === 'string')
        .map((item) => safeClientSubpath(item))
    )
  ).sort()
}

export async function scanClientEntryAssets(
  clientDir: string,
  config: RuntimeConfig = {}
): Promise<ClientEntryAssets> {
  const files = await loadClientEntryFiles(clientDir, config)
  const sharedClientModules = clientSharedModules(config)
  const assets: ClientEntryAssets = {
    scripts: new Map<string, ModuleScriptAsset>(),
    styles: new Map<string, StylesheetAsset>(),
  }

  await Promise.all(
    Array.from(files.scripts.entries()).map(async ([name, file]) => {
      const code = await fs.readFile(file, 'utf8')
      const rewritten = rewriteSharedClientImports(code, sharedClientModules)
      assets.scripts.set(name, {
        name,
        rel: clientEntryScriptRel(name),
        file,
        clientImports: collectClientImports(code),
        sharedClientModules: rewritten.sharedClientModules,
      })
    })
  )

  for (const [name, file] of files.styles) {
    assets.styles.set(name, {
      name,
      rel: clientEntryStyleRel(name),
      file,
    })
  }

  return assets
}

function requiredClientImports(pages: RenderedPage[] = []): ClientImport[] {
  return mergeClientImports(
    pages.flatMap((page) => [
      ...(page.layoutScript?.clientImports || []),
      ...(page.clientEntries || []).flatMap(
        (entry) => entry.clientImports || []
      ),
    ])
  )
}

function requiredClientEntries(
  pages: RenderedPage[] = []
): ModuleScriptAsset[] {
  const entries = new Map<string, ModuleScriptAsset>()
  for (const page of pages) {
    for (const entry of page.clientEntries || []) entries.set(entry.name, entry)
  }
  return Array.from(entries.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

function requiredClientStyles(pages: RenderedPage[] = []): StylesheetAsset[] {
  const entries = new Map<string, StylesheetAsset>()
  for (const page of pages) {
    for (const entry of page.clientStyles || []) entries.set(entry.name, entry)
  }
  return Array.from(entries.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

async function bundleClientStyle(
  outputDir: string,
  rel: string,
  file: string
): Promise<void> {
  const outputFile = path.join(outputDir, rel)
  await fs.mkdir(path.dirname(outputFile), { recursive: true })

  await esbuildBuild({
    bundle: true,
    legalComments: 'none',
    minify: true,
    outfile: outputFile,
    platform: 'browser',
    target: 'es2020',
    entryPoints: [file],
  })
}

export async function buildClientAssets(
  outputDir: string,
  clientDir: string,
  pages: RenderedPage[] = [],
  config: RuntimeConfig = {}
): Promise<void> {
  const imports = requiredClientImports(pages)
  const sharedClientModules = clientSharedModules(config)
  const runtimeImport = imports.find((item) => item.type === 'runtime')
  if (runtimeImport) {
    const file = await loadClientRuntimeFile(clientDir)
    if (!file) {
      throw new Error(
        `Missing client runtime "${CLIENT_RUNTIME_ID}". Add vp/client/runtime.ts or .js.`
      )
    }
    await bundleClientFile(outputDir, clientRuntimeRel(), file)
  }

  await Promise.all(
    imports
      .filter((item) => item.type === 'module')
      .map(async (item) =>
        bundleClientFile(
          outputDir,
          clientModuleRel(item.specifier),
          await resolveClientModuleFile(clientDir, item.specifier)
        )
      )
  )

  await Promise.all(
    requiredClientEntries(pages).map(async (entry) => {
      const code = await fs.readFile(entry.file, 'utf8')
      const rewritten = rewriteSharedClientImports(code, sharedClientModules)
      await bundleClientFile(outputDir, entry.rel, entry.file, rewritten.code)
    })
  )

  await Promise.all(
    requiredClientStyles(pages).map((entry) =>
      bundleClientStyle(outputDir, entry.rel, entry.file)
    )
  )
}

function componentRuntimeEntry(component: LoadedMarkdownComponent): string {
  if (component.runtimeExport === 'component') {
    return `import { component as definition } from ${JSON.stringify(component.file)};
export const name = ${JSON.stringify(component.name)};
export const dependsOn = ${JSON.stringify(component.dependsOn || [])};
export const init = definition.init;
export default { name, dependsOn, init };
`
  }

  if (component.runtimeExport === 'named') {
    return `import { init as componentInit } from ${JSON.stringify(component.file)};
export const name = ${JSON.stringify(component.name)};
export const dependsOn = ${JSON.stringify(component.dependsOn || [])};
export const init = componentInit;
export default { name, dependsOn, init };
`
  }

  return `import definition from ${JSON.stringify(component.file)};
export const name = ${JSON.stringify(component.name)};
export const dependsOn = ${JSON.stringify(component.dependsOn || [])};
export const init = definition.init;
export default { name, dependsOn, init };
`
}

function clientSharedModules(config: RuntimeConfig = {}): SharedClientModule[] {
  const client = serverOption(config, 'client') as
    | ServerClientConfig
    | undefined
  const shared = client?.shared
  const configured = Array.isArray(shared)
    ? shared
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : isRecord(shared)
      ? Object.values(shared)
          .flat()
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      : []

  return Array.from(new Set([...SHARED_CLIENT_MODULES, ...configured])).sort()
}

function isSharedClientModule(
  value: string,
  sharedModules: SharedClientModule[] = SHARED_CLIENT_MODULES
): value is SharedClientModule {
  return sharedModules.includes(value)
}

function sharedClientExportName(moduleName: SharedClientModule): string {
  return `__vp_${moduleName.replace(/[^a-zA-Z0-9_$]/g, '_')}_${contentHash(moduleName)}`
}

interface VpImportBinding {
  imported: string
  local: string
  typeOnly?: boolean
}

interface ParsedVpImportClause {
  defaultName: string
  namespaceName: string
  named: VpImportBinding[]
}

function splitImportClause(value: string): string[] {
  const parts: string[] = []
  let buffer = ''
  let depth = 0

  for (const char of value) {
    if (char === '{') depth += 1
    else if (char === '}') depth = Math.max(0, depth - 1)

    if (char === ',' && depth === 0) {
      parts.push(buffer.trim())
      buffer = ''
      continue
    }

    buffer += char
  }

  if (buffer.trim()) parts.push(buffer.trim())
  return parts
}

function parseNamedImportBindings(value: string): VpImportBinding[] {
  const body = value.trim().replace(/^\{/, '').replace(/\}$/, '')
  if (!body.trim()) return []

  return body
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const typeOnly = /^type\s+/.test(item)
      const clean = item.replace(/^type\s+/, '').trim()
      const parts = clean.split(/\s+as\s+/)
      const imported = String(parts[0] || '').trim()
      const local = String(parts[1] || imported).trim()
      return { imported, local, typeOnly }
    })
    .filter((item) => item.imported && item.local)
}

function parseVpImportClause(clause: string): ParsedVpImportClause {
  const result: ParsedVpImportClause = {
    defaultName: '',
    namespaceName: '',
    named: [],
  }
  const parts = splitImportClause(clause)

  for (const part of parts) {
    if (part.startsWith('{')) {
      result.named.push(...parseNamedImportBindings(part))
      continue
    }

    if (part.startsWith('*')) {
      const match = part.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/)
      result.namespaceName = match?.[1] || ''
      continue
    }

    result.defaultName = part.trim()
  }

  return result
}

function rewriteSharedClientImports(
  code: string,
  sharedClientModules: SharedClientModule[] = SHARED_CLIENT_MODULES
): {
  code: string
  sharedClientModules: SharedClientModule[]
} {
  const sharedClientModuleSet = new Set<SharedClientModule>()
  let index = 0

  const rewritten = code.replace(
    IMPORT_STATEMENT_RE,
    (statement, indent, rawClause, _quote, source) => {
      if (!isSharedClientModule(source, sharedClientModules)) {
        return statement
      }

      const exportName = sharedClientExportName(source)
      const tempName = `__vp_shared_${index++}`
      const clause = String(rawClause || '').trim()

      if (clause.startsWith('type ')) {
        return statement
      }

      if (!clause) {
        sharedClientModuleSet.add(source)
        return `${indent}import { ${exportName} as ${tempName} } from '${SHARED_CLIENT_RUNTIME_ID}';`
      }

      const parsed = parseVpImportClause(clause)
      const named = parsed.named.filter((item) => !item.typeOnly)
      if (!parsed.defaultName && !parsed.namespaceName && !named.length) {
        return statement
      }

      sharedClientModuleSet.add(source)
      if (parsed.namespaceName) {
        return `${indent}import { ${exportName} as ${parsed.namespaceName} } from '${SHARED_CLIENT_RUNTIME_ID}';`
      }

      const lines = [
        `${indent}import { ${exportName} as ${tempName} } from '${SHARED_CLIENT_RUNTIME_ID}';`,
      ]

      if (parsed.defaultName) {
        lines.push(
          `${indent}const ${parsed.defaultName} = ${tempName}.default;`
        )
      }

      if (named.length) {
        const names = named
          .map(({ imported, local }) =>
            imported === local ? imported : `${imported}: ${local}`
          )
          .join(', ')
        lines.push(`${indent}const { ${names} } = ${tempName};`)
      }

      return lines.join('\n')
    }
  )

  return {
    code: rewritten,
    sharedClientModules: Array.from(sharedClientModuleSet).sort(),
  }
}

function rewriteAssetReferences(
  html: string,
  assetMap: Map<string, string> = new Map()
): string {
  let output = html

  for (const [from, to] of assetMap) {
    output = output.split(`public/${from}`).join(`public/${to}`)
  }

  return output
}

async function hashRootAssets(outputDir: string): Promise<Map<string, string>> {
  const publicDir = path.join(outputDir, 'public')
  const assetFiles = ['styles.css', 'runtime.js']

  const assetMap = new Map<string, string>()

  for (const file of assetFiles) {
    const fullPath = path.join(publicDir, file)
    if (!(await pathExists(fullPath))) continue

    const hashedFile = hashFileName(file)
    await fs.rename(fullPath, path.join(publicDir, hashedFile))
    assetMap.set(file, hashedFile)
  }

  return assetMap
}

async function rewriteHtmlAssets(
  outputDir: string,
  assetMap: Map<string, string> = new Map()
): Promise<void> {
  const files = (
    await glob('**/*.html', {
      cwd: outputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort()

  await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(outputDir, file)
      const html = await fs.readFile(fullPath, 'utf8')
      const next = rewriteAssetReferences(html, assetMap)
      if (next !== html) {
        await fs.writeFile(fullPath, next, 'utf8')
      }
    })
  )
}

async function minifyJsAssets(outputDir: string): Promise<number> {
  const files = (
    await glob('**/*.js', {
      cwd: outputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort()

  await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(outputDir, file)
      const code = await fs.readFile(fullPath, 'utf8')
      const result = await esbuildTransform(code, {
        format: 'esm',
        legalComments: 'none',
        loader: 'js',
        minify: true,
        target: 'es2020',
      })

      await fs.writeFile(fullPath, result.code.trim(), 'utf8')
    })
  )

  return files.length
}

async function bundleModuleScript(
  outputDir: string,
  name: string,
  code: string,
  sourcefile: string,
  options: {
    external?: string[]
    loader?: 'js' | 'ts'
    resolveDir?: string
  } = {}
): Promise<string> {
  const result = await esbuildBuild({
    bundle: true,
    external: options.external,
    format: 'esm',
    legalComments: 'none',
    minify: true,
    platform: 'browser',
    target: 'es2020',
    write: false,
    stdin: {
      contents: code,
      loader: options.loader || 'js',
      resolveDir: options.resolveDir || workingRoot,
      sourcefile,
    },
  })
  const output = result.outputFiles?.[0]?.text || code
  const rel = moduleScriptRel(name, output)
  const outputFile = path.join(outputDir, rel)

  await fs.mkdir(path.dirname(outputFile), { recursive: true })
  await fs.writeFile(outputFile, output, 'utf8')
  return rel
}

export async function buildComponentScripts(
  outputDir: string,
  components: LoadedMarkdownComponent[] = []
): Promise<Map<string, ModuleScriptAsset>> {
  const assets = new Map<string, ModuleScriptAsset>()

  await Promise.all(
    components
      .filter((component) => typeof component.init === 'function')
      .map(async (component) => {
        const code = componentRuntimeEntry(component)
        const rel = await bundleModuleScript(
          outputDir,
          component.name,
          code,
          `${component.name}.component-entry.js`
        )

        assets.set(component.name, {
          name: component.name,
          rel,
          file: component.file,
          dependsOn: component.dependsOn,
        })
      })
  )

  return assets
}

export async function buildLayoutScripts(
  outputDir: string,
  layouts: LayoutMap,
  config: RuntimeConfig = {}
): Promise<Map<string, ModuleScriptAsset>> {
  const assets = new Map<string, ModuleScriptAsset>()
  const sharedClientModules = clientSharedModules(config)

  await Promise.all(
    Array.from(layouts.values())
      .filter((layout) => layout.scriptFile)
      .map(async (layout) => {
        const scriptFile = String(layout.scriptFile)
        const code = await fs.readFile(scriptFile, 'utf8')
        const clientImports = collectClientImports(code)
        const rewritten = rewriteSharedClientImports(code, sharedClientModules)
        const loader =
          path.extname(scriptFile).toLowerCase() === '.ts' ? 'ts' : 'js'
        const rel = await bundleModuleScript(
          outputDir,
          layout.name,
          rewritten.code,
          scriptFile,
          {
            external: [
              SHARED_CLIENT_RUNTIME_ID,
              CLIENT_RUNTIME_ID,
              `${CLIENT_MODULE_PREFIX}*`,
            ],
            loader,
            resolveDir: path.dirname(scriptFile),
          }
        )

        assets.set(layout.name, {
          name: layout.name,
          rel,
          file: scriptFile,
          sharedClientModules: rewritten.sharedClientModules,
          clientImports,
        })
      })
  )

  return assets
}

function pageComponentScripts(
  components: string[] = [],
  assets: Map<string, ModuleScriptAsset> = new Map()
): ModuleScriptAsset[] {
  const result = new Map<string, ModuleScriptAsset>()
  const stack = [...components]

  while (stack.length) {
    const name = stack.pop()
    if (!name || result.has(name)) continue

    const asset = assets.get(name)
    if (!asset) continue
    result.set(name, asset)

    for (const dependency of asset.dependsOn || []) {
      if (!result.has(dependency)) stack.push(dependency)
    }
  }

  return Array.from(result.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

export function pageSharedClientModules(
  pages: RenderedPage[] = []
): SharedClientModule[] {
  return Array.from(
    new Set(
      pages.flatMap((page) => [
        ...(page.layoutScript?.sharedClientModules || []),
        ...(page.clientEntries || []).flatMap(
          (entry) => entry.sharedClientModules || []
        ),
      ])
    )
  ).sort()
}

export function readSource(file: string, markdown: string): SourcePage {
  const frontmatter = parseFrontmatter(markdown) as FrontmatterData

  return {
    file,
    markdown,
    frontmatter,
    seo: pickSeoFrontmatter(frontmatter) as SeoData,
    rel: toPosix(stripMdExt(file)),
    title: pageTitle(markdown, file),
  }
}

function codeFenceLanguage(info: string): string {
  const first =
    String(info || '')
      .trim()
      .split(/\s+/)[0] || ''
  if (!first || first.startsWith('{')) return ''

  return first
    .replace(/^language-/i, '')
    .replace(/[{:].*$/g, '')
    .trim()
    .toLowerCase()
}

export function markdownCodeLanguages(markdown: string): string[] {
  const languages = new Set<string>()

  markdown.replace(CODE_FENCE_RE, (_match, _marker, info) => {
    const language = codeFenceLanguage(String(info || ''))
    if (language) languages.add(language)
    return ''
  })

  return Array.from(languages).sort()
}

export function sourceCodeLanguages(
  sources: Pick<SourcePage, 'markdown'>[] = []
): string[] {
  return Array.from(
    new Set(sources.flatMap((source) => markdownCodeLanguages(source.markdown)))
  ).sort()
}

function rootIndexExists(sources: SourcePage[] = []): boolean {
  return sources.some((source) => source.rel === 'index.html')
}

function localeHomeRel(
  source: SourcePage,
  config: RuntimeConfig = {},
  languages: LanguagesConfig = {},
  hasRootIndex = false
): string {
  if (hasRootIndex || !isI18nEnabled(config)) return 'index.html'

  const rel = normalizeLocaleRoute(source.rel)
  const entries = localeRouteEntries(languages).sort(
    (a, b) => b.route.length - a.route.length
  )
  const matched = entries.find(
    (entry) =>
      rel === `${entry.route}/index.html` || rel.startsWith(`${entry.route}/`)
  )
  const i18n = (serverOption(config, 'i18n') || {}) as RuntimeI18nConfig
  const route = matched?.route || defaultLocaleRoute(i18n, languages)

  return route && route !== 'auto' ? `${route}/index.html` : 'index.html'
}

function brandHref(
  source: SourcePage,
  config: RuntimeConfig = {},
  languages: LanguagesConfig = {},
  hasRootIndex = false
): string {
  return relativeAsset(
    source.rel,
    localeHomeRel(source, config, languages, hasRootIndex)
  )
}

export function renderSource(
  source: SourcePage,
  md: MarkdownItInstance,
  config: RuntimeConfig,
  languages: LanguagesConfig,
  menuItems: NavItem[],
  sidebarItems: RuntimeSidebar,
  layouts: LayoutMap,
  componentScriptAssets: Map<string, ModuleScriptAsset>,
  layoutScriptAssets: Map<string, ModuleScriptAsset>,
  clientEntryAssets: ClientEntryAssets,
  llmsConfig: UnknownRecord,
  footerScript: FooterScriptConfig,
  lastEditCache: LastEditCache,
  hasRootIndex = false
): RenderedPage {
  const env = {
    file: source.file,
    components: new Set<string>(),
    config,
  }
  const rendered = md.render(source.markdown, env)
  const articleBody = injectLlmsControls(
    cleanHtml(transformComponentTags(rendered)),
    source,
    config,
    llmsConfig,
    languages
  )
  const editorHelp = renderEditorHelp(
    source,
    config,
    languages,
    resolveLastEditText(source, config, lastEditCache)
  )
  const body = articleBody
  const pageInfo = {
    title: source.title,
    rel: source.rel,
    seo: source.seo,
  }
  const i18n = createDocI18n(languages, pageInfo)
  const locale = currentLocale(languages, pageInfo)
  const pageSidebarItems = resolvePageSidebarItems(sidebarItems, pageInfo)
  const menuEnabled = menuItems.length > 0
  const sidebarEnabled = pageSidebarItems.length > 0
  const sidebar = sidebarEnabled
    ? renderTreeNav(
        pageSidebarItems,
        pageInfo,
        i18n,
        locale,
        ' data-vp-sidebar'
      )
    : ''
  const mobileSidebar = sidebarEnabled
    ? `<div data-vp-mobile-sidebar-content hidden>
      <div class="vp-mobile-sidebar-panel">
        ${renderTreeNav(pageSidebarItems, pageInfo, i18n, locale, ' data-vp-mobile-sidebar-nav')}
      </div>
    </div>`
    : ''
  const prevNext = renderPrevNext(
    config,
    pageSidebarItems,
    pageInfo,
    i18n,
    locale
  )
  const pageLayout = renderLayout({
    body: articleBody,
    editorHelp,
    sidebar,
    mobileSidebar,
    prevNext,
    source,
    config,
    sidebarEnabled,
    tocEnabled: isTocEnabled(config),
    chrome: {
      rel: source.rel,
      brandHref: brandHref(source, config, languages, hasRootIndex),
      config,
      languages,
      i18n,
      menuItems,
      page: pageInfo,
      menuEnabled,
      searchEnabled: isSearchEnabled(config),
      i18nEnabled: isI18nEnabled(config),
      sidebarEnabled,
      tocEnabled: isTocEnabled(config),
      themeEnabled: isThemeEnabled(config),
      authEnabled: isAuthEnabled(config),
    },
    layouts,
  })
  const renderedPageLayout = {
    ...pageLayout,
    html: renderExternalLinks(pageLayout.html, config),
  }
  const components = Array.from(env.components).sort()
  const componentScripts = pageComponentScripts(
    components,
    componentScriptAssets
  )
  const layoutScript = layoutScriptAssets.get(pageLayout.name) || null
  const clientEntryNames = pageClientEntryNames(source)
  const clientEntries = clientEntryNames.flatMap((name) => {
    const asset = clientEntryAssets.scripts.get(name)
    return asset ? [asset] : []
  })
  const clientStyles = clientEntryNames.flatMap((name) => {
    const asset = clientEntryAssets.styles.get(name)
    return asset ? [asset] : []
  })

  for (const name of clientEntryNames) {
    if (
      !clientEntryAssets.scripts.has(name) &&
      !clientEntryAssets.styles.has(name)
    ) {
      throw new Error(
        `Missing client entry "${name}" in ${source.rel}. Add vp/client/entries/${name}.ts, .js, or .css, or configure server.client.entries.`
      )
    }
  }
  const clientImports = mergeClientImports([
    ...(layoutScript?.clientImports || []),
    ...clientEntries.flatMap((entry) => entry.clientImports || []),
  ])
  const runtimeImportMap = Boolean(
    layoutScript?.sharedClientModules?.length ||
    clientEntries.some((entry) => entry.sharedClientModules?.length)
  )
  const importMap = {
    ...(runtimeImportMap
      ? {
          [SHARED_CLIENT_RUNTIME_ID]: relativeAsset(
            source.rel,
            'public/runtime.js'
          ),
        }
      : {}),
    ...clientImportMap(source.rel, clientImports),
  }

  return {
    ...source,
    body,
    content: htmlText(articleBody),
    components,
    componentScripts,
    layoutScript,
    clientEntries,
    clientStyles,
    html: renderHtml({
      title: source.title,
      seo: source.seo,
      body,
      rel: source.rel,
      components,
      componentScripts: componentScripts.map((script) => script.rel),
      layoutScript: layoutScript?.rel,
      config,
      languages,
      pageLayout: renderedPageLayout,
      searchEnabled: isSearchEnabled(config),
      importMap,
      clientScripts: clientEntries.map((entry) => entry.rel),
      clientStyles: clientStyles.map((entry) => entry.rel),
      footerScript,
    }),
  }
}

function createSearchIndex(pages: RenderedPage[] = []): SearchIndexItem[] {
  return pages.map((page) => ({
    title: page.seo?.title || page.title,
    rel: page.rel,
    keywords: page.seo?.keywords || '',
    description: page.seo?.description || '',
    excerpt: excerptText(page.seo?.description || page.content),
    content: page.content,
  }))
}

export function renderSearchIndexFiles(
  pages: RenderedPage[] = [],
  config: RuntimeConfig = {},
  languages: LanguagesConfig = {}
): Map<string, string> {
  const routes = isI18nEnabled(config) ? searchLocaleRoutes(languages) : []
  const targets = routes.length
    ? routes.map((route) => ({
        fileName: searchIndexFileName(route),
        pages: pages.filter((page) => pageInSearchLocale(page.rel, route)),
      }))
    : [{ fileName: searchIndexFileName(), pages }]

  return new Map(
    targets.map(({ fileName, pages: targetPages }) => [
      fileName,
      `export const searchIndex = ${JSON.stringify(createSearchIndex(targetPages))};\n`,
    ])
  )
}

export async function writeSearchIndex(
  outputDir: string,
  pages: RenderedPage[] = [],
  config: RuntimeConfig = {},
  languages: LanguagesConfig = {}
): Promise<void> {
  const files = renderSearchIndexFiles(pages, config, languages)

  await Promise.all(
    Array.from(files.entries()).map(([fileName, code]) =>
      fs.writeFile(path.join(outputDir, fileName), code, 'utf8')
    )
  )
}

function siteUrl(config: RuntimeConfig = {}): string {
  return String(config.siteUrl || '')
    .trim()
    .replace(/\/+$/g, '')
}

function sitemapLoc(page: Pick<RenderedPage, 'rel'>, baseUrl: string): string {
  const rel = toPosix(page.rel).replace(/^\/+/, '')
  const encodedRel = rel.split('/').map(encodeURIComponent).join('/')
  return `${baseUrl}/${encodedRel}`
}

function escapeXml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function writeSitemap(
  outputDir: string,
  pages: RenderedPage[] = [],
  config: RuntimeConfig = {}
): Promise<void> {
  const baseUrl = siteUrl(config)
  const urls = pages
    .map(
      (page) =>
        `  <url>\n    <loc>${escapeXml(sitemapLoc(page, baseUrl))}</loc>\n  </url>`
    )
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

  await fs.writeFile(path.join(outputDir, 'sitemap.xml'), xml, 'utf8')
}

export async function writeRobots(
  outputDir: string,
  robotsConfig: UnknownRecord = {}
): Promise<void> {
  const text = renderRobotsTxt(robotsConfig)
  await fs.writeFile(path.join(outputDir, 'robots.txt'), text, 'utf8')
}

export async function writeLlms(
  outputDir: string,
  pages: RenderedPage[] = [],
  config: RuntimeConfig = {},
  llmsConfig: UnknownRecord = {}
): Promise<void> {
  const text = renderLlmsTxt(llmsConfig, config, pages)
  await fs.writeFile(path.join(outputDir, 'llms.txt'), text, 'utf8')

  await Promise.all(
    pages.map(async (page) => {
      const outputFile = path.join(outputDir, markdownRouteRel(page))
      await fs.mkdir(path.dirname(outputFile), { recursive: true })
      await fs.writeFile(outputFile, page.markdown, 'utf8')
    })
  )
}

export async function build({
  inputDir = defaultInputDir,
  outputDir = defaultOutputDir,
  assetsDir = defaultAssetsDir,
  configDir = defaultConfigDir,
  cacheDir,
  layoutsDir = defaultLayoutsDir,
  componentsDir = defaultComponentsDir,
  report = true,
  buildReason = 'initial',
  reportMode = 'build',
  reportState: buildReportState,
}: BuildOptions = {}): Promise<void> {
  if (path.resolve(inputDir) === path.resolve(outputDir)) {
    throw new Error('inputDir and outputDir must be different directories.')
  }

  await fs.mkdir(inputDir, { recursive: true })
  await fs.mkdir(assetsDir, { recursive: true })
  await fs.mkdir(layoutsDir, { recursive: true })
  await fs.mkdir(componentsDir, { recursive: true })
  await ensureSourceConfig(configDir)
  const resolvedCacheDir =
    cacheDir || path.join(path.dirname(configDir), 'cache')
  const clientDir = path.join(path.dirname(configDir), 'client')
  await fs.mkdir(clientDir, { recursive: true })
  const config = await loadRuntimeConfig(configDir)
  validateRuntimeConfig(config)
  const footerScript = await loadFooterScript(configDir)
  const customComponents = await loadCustomComponents(componentsDir)
  const layouts = await loadLayouts({ packageRoot, layoutsDir })
  const lastEditCache = serverOption(config, 'lastEdit')
    ? await loadLastEditCache(resolvedCacheDir)
    : {}
  const logOutput = report ? console.warn : () => {}
  const reportState = report ? buildReportState : undefined
  const isDevReport = reportMode === 'dev'
  const isInitialBuild = buildReason === 'initial'
  const showSummary = !isDevReport || isInitialBuild
  const updatedLabel = isDevReport && !isInitialBuild ? 'Updated' : 'built'

  logOutput(`Build Started: ${buildReason}`)

  await fs.rm(outputDir, { force: true, recursive: true })
  await fs.mkdir(outputDir, { recursive: true })
  const publicDir = path.join(outputDir, 'public')
  await fs.mkdir(publicDir, { recursive: true })
  if (serverOption(config, 'lastEdit')) {
    await fs.mkdir(resolvedCacheDir, { recursive: true })
  }
  await copyStaticAssets(assetsDir, publicDir)

  const languages = isI18nEnabled(config)
    ? resolveI18nData(config, await loadLanguages(configDir))
    : {}
  const menuItems = await loadMenuItems(configDir)
  const sidebarItems = await loadSidebarItems(configDir)
  const directorySidebarItems = await loadDirectorySidebarItems(inputDir)
  const llmsConfig = isLlmsEnabled(config)
    ? await loadLlmsConfig(configDir)
    : {}
  const files = (
    await glob('**/*.md', {
      cwd: inputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort()
  const sources = await Promise.all(
    files.map(async (file) =>
      readSource(file, await fs.readFile(path.join(inputDir, file), 'utf8'))
    )
  )
  const hasRootIndex = rootIndexExists(sources)
  const md = await createMarkdown(
    config,
    customComponents,
    sourceCodeLanguages(sources)
  )

  await buildCss(publicDir, layouts)
  const componentScriptAssets = await buildComponentScripts(
    outputDir,
    customComponents
  )
  const layoutScriptAssets = await buildLayoutScripts(
    outputDir,
    layouts,
    config
  )
  const clientEntryAssets = await scanClientEntryAssets(clientDir, config)
  const runtimeSidebarItems = createRuntimeSidebarConfig(
    sidebarItems,
    directorySidebarItems
  )

  const pages = sources.map((source) =>
    renderSource(
      source,
      md,
      config,
      languages,
      menuItems as NavItem[],
      runtimeSidebarItems,
      layouts,
      componentScriptAssets,
      layoutScriptAssets,
      clientEntryAssets,
      llmsConfig,
      footerScript,
      lastEditCache,
      hasRootIndex
    )
  )
  await buildRuntime(publicDir, {
    config,
    languages,
    menuItems,
    sidebarItems: createRuntimeSidebarConfig(
      sidebarItems,
      directorySidebarItems
    ),
    sharedClientModules: pageSharedClientModules(pages),
  })
  await buildClientAssets(outputDir, clientDir, pages, config)
  if (isSearchEnabled(config)) {
    await writeSearchIndex(publicDir, pages, config, languages)
  }
  if (isSitemapEnabled(config)) await writeSitemap(outputDir, pages, config)
  if (isLlmsEnabled(config)) {
    await writeLlms(outputDir, pages, config, llmsConfig)
  }
  if (isRobotsEnabled(config)) {
    await writeRobots(outputDir, await loadRobotsConfig(configDir))
  }
  if (serverOption(config, 'lastEdit')) {
    await writeLastEditCache(resolvedCacheDir, lastEditCache)
  }
  for (const page of pages) {
    const outputFile = path.join(outputDir, page.rel)
    await fs.mkdir(path.dirname(outputFile), { recursive: true })
    await fs.writeFile(outputFile, page.html, 'utf8')
    logIfChanged(
      reportState,
      logOutput,
      outputFile,
      page.html,
      `${updatedLabel}: ${toPosix(path.relative(workingRoot, outputFile))}`
    )
  }

  await writeDefaultLocaleEntrypoint(
    outputDir,
    config,
    languages,
    pages,
    footerScript,
    reportState,
    logOutput
  )
  const minifiedAssets = await minifyJsAssets(outputDir)
  const assetMap = await hashRootAssets(outputDir)
  await rewriteHtmlAssets(outputDir, assetMap)

  if (showSummary) {
    logOutput('Build Complete.')
    logOutput(
      `Built Directory: ${toPosix(path.relative(workingRoot, outputDir))}`
    )
    logOutput(`Minified Assets: ${minifiedAssets} file(s).`)
    logOutput(`Built Pages: ${pages.length}.`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build({
    inputDir: resolveDir(workingRoot, process.argv[2], defaultInputDir),
    outputDir: resolveDir(workingRoot, process.argv[3], defaultOutputDir),
    assetsDir: defaultAssetsDir,
    configDir: defaultConfigDir,
    layoutsDir: defaultLayoutsDir,
    componentsDir: defaultComponentsDir,
  }).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
