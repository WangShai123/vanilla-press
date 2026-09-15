import type { MarkdownIt as MarkdownItType } from 'markdown-it'

import type { MarkdownEnv } from './utilities/markdown.ts'

export type UnknownRecord = Record<string, unknown>

export interface SeoData extends UnknownRecord {
  title?: string
  keywords?: string
  description?: string
}

export interface LocaleEntry extends UnknownRecord {
  code?: string
  path?: string
  label?: string
}

export type LanguageMessageValue =
  | string
  | number
  | boolean
  | null
  | LanguageMessageTree

export interface LanguageMessageTree {
  [key: string]: LanguageMessageValue
}

export type LanguageMessages = Record<string, LanguageMessageTree>

export interface LanguagesConfig extends UnknownRecord {
  locale?: string
  fallbackLocale?: string
  locales?: LocaleEntry[]
  messages?: LanguageMessages | UnknownRecord
  languages?: LanguageMessages | UnknownRecord
}

export interface RuntimeI18nConfig extends UnknownRecord {
  locale?: string
  fallbackLocale?: string
  locales?: LocaleEntry[]
  redirectToDefault?: boolean
}

export interface RuntimeFeatureConfig extends UnknownRecord {
  enabled?: boolean
  label?: string
}

export interface RuntimeTocConfig extends RuntimeFeatureConfig {
  headings?: string
  offset?: number
}

export interface RuntimeLlmsFeatureConfig extends UnknownRecord {
  link?: boolean
  copy?: boolean
  chatgpt?: boolean
  claude?: boolean
}

export interface RuntimeThemeDefaultConfig extends UnknownRecord {
  mode?: string
  theme?: string
  radius?: string
  shadow?: string
  font?: string
}

export interface RuntimeThemeConfig extends RuntimeFeatureConfig {
  default?: RuntimeThemeDefaultConfig
  options?: UnknownRecord
  panel?: unknown
  offcanvas?: {
    direction?: 'top' | 'right' | 'bottom' | 'left'
  } & UnknownRecord
}

export type RuntimeFeatureSwitch = boolean | RuntimeFeatureConfig
export type RuntimeEditorSize = boolean | 'sm' | 'md' | 'lg' | 'xl'
export type FooterScriptType = 'script' | 'module'
export type FooterScriptConfig = string

export interface ClientRuntimeConfig extends UnknownRecord {
  toc?: boolean | RuntimeTocConfig
  search?: RuntimeFeatureSwitch
  theme?: boolean | RuntimeThemeConfig
  auth?: RuntimeFeatureSwitch
  editorSize?: RuntimeEditorSize
}

export interface RuntimeEditorLinkConfig extends UnknownRecord {
  pattern?: string
  text?: unknown
}

export interface RuntimeLastEditConfig extends UnknownRecord {
  text?: unknown
  format?: string
  utc?: boolean
}

export interface RuntimeHighlightConfig extends UnknownRecord {
  light?: string
  dark?: string
}

export type ClientSharedConfig = string[] | Record<string, string[]>
export type ClientEntryConfig = string | string[]

export interface ServerClientConfig extends UnknownRecord {
  entries?: Record<string, ClientEntryConfig>
  shared?: ClientSharedConfig
}

export interface ServerRuntimeConfig extends UnknownRecord {
  social?: UnknownRecord
  icp?: string
  externalLink?: RuntimeFeatureSwitch
  prevNext?: RuntimeFeatureSwitch
  i18n?: RuntimeI18nConfig
  highlight?: RuntimeHighlightConfig
  llms?: RuntimeLlmsFeatureConfig
  footerScript?: FooterScriptType
  client?: ServerClientConfig
  editLink?: boolean | RuntimeEditorLinkConfig
  lastEdit?: boolean | RuntimeLastEditConfig
}

export interface VPRuntime extends UnknownRecord {
  siteUrl?: string
  siteName?: string
  server?: ServerRuntimeConfig
  client?: ClientRuntimeConfig
  aside?: {
    html?: string
  } & UnknownRecord
}

export type RuntimeConfig = VPRuntime

export interface FrontmatterData extends UnknownRecord {
  layout?: string
  layouts?: Record<string, unknown>
  client?:
    | string
    | string[]
    | {
        entry?: string | string[]
      }
}

export interface SourcePage {
  file: string
  markdown: string
  frontmatter: FrontmatterData
  seo: SeoData
  rel: string
  title: string
}

export interface ModuleScriptAsset {
  name: string
  rel: string
  file: string
  dependsOn?: string[]
  sharedClientModules?: SharedClientModule[]
  clientImports?: ClientImport[]
}

export interface StylesheetAsset {
  name: string
  rel: string
  file: string
}

export interface ClientEntryAssets {
  scripts: Map<string, ModuleScriptAsset>
  styles: Map<string, StylesheetAsset>
}

export type SharedClientModule = string

export interface ClientImport {
  specifier: string
  type: 'runtime' | 'module'
}

export interface RuntimePage {
  rel?: string
  title?: string
  seo?: SeoData
}

export interface DocI18n {
  t(key: string): string
  getLocale(): string
  getFallbackLocale(): string
  setLocale(locale: string): unknown
}

export interface NavItem extends UnknownRecord {
  id?: string | number
  path?: string
  href?: string
  url?: string
  i18n?: unknown
  label?: unknown
  title?: unknown
  target?: string
  classes?: string[]
  collapse?: boolean
  children?: NavItem[]
}

export type MenuConfig = NavItem[]

export type SidebarConfig = NavItem[]

export interface DirectorySidebarConfig extends UnknownRecord {
  dir: string
  items: NavItem[]
}

export interface RuntimeSidebarConfig extends UnknownRecord {
  items: NavItem[]
  directories: DirectorySidebarConfig[]
}

export type RuntimeSidebar = NavItem[] | RuntimeSidebarConfig

export interface RobotsRule extends UnknownRecord {
  userAgent?: string | string[]
  allow?: string | string[]
  disallow?: string | string[]
}

export interface RobotsConfig extends UnknownRecord {
  rules?: RobotsRule[]
}

export interface LlmsLocaleLabels extends UnknownRecord {
  link?: string
  copy?: string
  chatgpt?: string
  claude?: string
  options?: string
}

export interface LlmsConfig extends UnknownRecord {
  title?: string
  description?: string
  sectionTitle?: string
  container?: {
    labels?: Record<string, LlmsLocaleLabels>
  } & UnknownRecord
}

export interface SearchIndexItem extends UnknownRecord {
  rel?: string
  title?: string
  keywords?: string
  description?: string
  content?: string
  excerpt?: string
}

export interface SearchIndexPayload extends UnknownRecord {
  searchIndex?: SearchIndexItem[]
}

export type SearchSource =
  | SearchIndexItem[]
  | SearchIndexPayload
  | (() =>
      | SearchIndexItem[]
      | SearchIndexPayload
      | Promise<SearchIndexItem[] | SearchIndexPayload>)

export interface RenderedPage extends SourcePage {
  body: string
  content: string
  components: string[]
  componentScripts: ModuleScriptAsset[]
  layoutScript?: ModuleScriptAsset | null
  clientEntries: ModuleScriptAsset[]
  clientStyles: StylesheetAsset[]
  html: string
}

export type LayoutSource = 'src' | 'vp'

export interface LayoutDefinition {
  name: string
  source: LayoutSource
  dir: string
  template: string
  style: string
  scriptFile?: string
}

export type LayoutMap = Map<string, LayoutDefinition>

export interface PageLayout {
  name: string
  html: string
}

export interface ChromeOptions {
  rel: string
  brandHref: string
  config: RuntimeConfig
  languages: LanguagesConfig
  i18n: DocI18n
  menuItems: NavItem[]
  page: RuntimePage
  menuEnabled: boolean
  searchEnabled: boolean
  i18nEnabled: boolean
  sidebarEnabled: boolean
  tocEnabled: boolean
  themeEnabled: boolean
  authEnabled: boolean
}

export interface RuntimeBundleData {
  config?: RuntimeConfig
  languages?: LanguagesConfig | UnknownRecord
  menuItems?: unknown[]
  sidebarItems?: unknown[] | RuntimeSidebarConfig
  sharedClientModules?: SharedClientModule[]
}

export interface BuildOptions {
  inputDir?: string
  outputDir?: string
  assetsDir?: string
  configDir?: string
  cacheDir?: string
  layoutsDir?: string
  componentsDir?: string
  report?: boolean
  buildReason?: string
  reportMode?: 'build' | 'dev'
  reportState?: BuildReportState
}

export interface BuildReportState {
  hashes: Map<string, string>
}

export interface MarkdownComponentContext {
  markComponent(env: MarkdownEnv | undefined, name: string): void
  escapeHtml(value: unknown): string
}

export type MarkdownComponentInstall = (
  md: MarkdownItType,
  context: MarkdownComponentContext
) => void

export type RuntimeComponentInit = (
  root: Document | Element,
  config?: RuntimeConfig
) => void

export interface MarkdownComponentDefinition extends UnknownRecord {
  name: string
  install?: MarkdownComponentInstall
  init?: RuntimeComponentInit
  dependsOn?: string[]
}

export interface LoadedMarkdownComponent extends MarkdownComponentDefinition {
  file: string
  runtimeExport: 'default' | 'component' | 'named'
}

export function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
