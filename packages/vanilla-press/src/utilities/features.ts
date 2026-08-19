import { isPlainObject } from 'vanilla-jui'

import type { RuntimeConfig, UnknownRecord } from '../types.ts'

export interface TocOptions {
  headings: string
  offset: number
}

export interface LlmsRuntimeOptions {
  enabled: boolean
  link: boolean
  copy: boolean
  chatgpt: boolean
  claude: boolean
}

type FeatureObject = UnknownRecord & {
  enabled?: boolean
  headings?: string
  offset?: unknown
  link?: boolean
  copy?: boolean
  chatgpt?: boolean
  claude?: boolean
}

function featureObject(value: unknown): FeatureObject {
  return isPlainObject(value) ? (value as FeatureObject) : {}
}

function runtimeSection(config: RuntimeConfig = {}): UnknownRecord {
  return isPlainObject(config.runtime) ? (config.runtime as UnknownRecord) : {}
}

export function browserOption(
  config: RuntimeConfig = {},
  key: string
): unknown {
  const browser = isPlainObject(config.browser)
    ? (config.browser as UnknownRecord)
    : {}
  const runtime = runtimeSection(config)
  if (Object.hasOwn(browser, key)) return browser[key]
  if (Object.hasOwn(runtime, key)) return runtime[key]
  return config[key]
}

export function buildOption(config: RuntimeConfig = {}, key: string): unknown {
  const build = isPlainObject(config.build)
    ? (config.build as UnknownRecord)
    : {}
  const runtime = runtimeSection(config)
  if (Object.hasOwn(build, key)) return build[key]
  if (Object.hasOwn(runtime, key)) return runtime[key]
  return config[key]
}

export function runtimeOption(
  config: RuntimeConfig = {},
  key: string
): unknown {
  return browserOption(config, key)
}

export function isThemeEnabled(config: RuntimeConfig = {}): boolean {
  const theme = browserOption(config, 'theme')
  if (theme === false) return false
  return featureObject(theme).enabled !== false
}

export function isAuthEnabled(config: RuntimeConfig = {}): boolean {
  const auth = browserOption(config, 'auth')
  return auth === true || featureObject(auth).enabled === true
}

export function isI18nEnabled(config: RuntimeConfig = {}): boolean {
  const i18n = browserOption(config, 'i18n')
  if (i18n === false) return false
  return featureObject(i18n).enabled !== false
}

export function isSeoEnabled(config: RuntimeConfig = {}): boolean {
  return browserOption(config, 'seo') !== false
}

export function isSearchEnabled(config: RuntimeConfig = {}): boolean {
  return browserOption(config, 'search') !== false
}

export function isHighlightEnabled(config: RuntimeConfig = {}): boolean {
  const highlight = browserOption(config, 'highlight')
  if (highlight === false) return false
  return featureObject(highlight).enabled !== false
}

export function isExternalLinkEnabled(config: RuntimeConfig = {}): boolean {
  return browserOption(config, 'externalLink') !== false
}

export function isMenuEnabled(config: RuntimeConfig = {}): boolean {
  return browserOption(config, 'menu') !== false
}

export function isSidebarEnabled(config: RuntimeConfig = {}): boolean {
  return browserOption(config, 'sidebar') !== false
}

export function isTocEnabled(config: RuntimeConfig = {}): boolean {
  const toc = browserOption(config, 'toc')
  if (toc === false) return false
  return featureObject(toc).enabled !== false
}

export function tocOptions(config: RuntimeConfig = {}): TocOptions {
  const toc = featureObject(browserOption(config, 'toc'))
  const offset = Number(toc.offset)

  return {
    headings:
      typeof toc.headings === 'string' && toc.headings.trim()
        ? toc.headings
        : 'h2, h3',
    offset: Number.isFinite(offset) ? offset : 80,
  }
}

export function isPrevNextEnabled(config: RuntimeConfig = {}): boolean {
  const prevNext = browserOption(config, 'prevNext')
  return prevNext === true || featureObject(prevNext).enabled === true
}

export function isSitemapEnabled(config: RuntimeConfig = {}): boolean {
  const sitemap = buildOption(config, 'sitemap')
  return sitemap === true || featureObject(sitemap).enabled === true
}

export function isRobotsEnabled(config: RuntimeConfig = {}): boolean {
  return buildOption(config, 'robots') !== false
}

export function isLlmsEnabled(config: RuntimeConfig = {}): boolean {
  const llms = buildOption(config, 'llms')
  if (llms === false) return false
  return featureObject(llms).enabled !== false
}

export function isVpScriptEnabled(): boolean {
  return true
}

export function llmsOptions(config: RuntimeConfig = {}): LlmsRuntimeOptions {
  const llms = featureObject(buildOption(config, 'llms'))
  const enabled = isLlmsEnabled(config)

  return {
    enabled,
    link: enabled && llms.link !== false,
    copy: enabled && llms.copy !== false,
    chatgpt: enabled && llms.chatgpt !== false,
    claude: enabled && llms.claude !== false,
  }
}
