import type { RuntimeConfig } from '../types.ts'
import { browserOption } from './features.ts'
import { toText } from './string.ts'

interface LocalePathItem {
  path?: unknown
}

export function pageTitle(markdown: string, file: string): string {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim()
  if (heading) return heading
  const value = String(file || '')
  const name = value.split(/[/\\]/).pop() || ''
  return name.replace(/\.md$/i, '')
}

function normalizeRel(value: unknown): string {
  return toText(value)
    .replace(/\\/g, '/')
    .replace(/[?#].*$/g, '')
    .replace(/^\.?\/*/g, '')
    .replace(/\/+/g, '/')
    .replace(/\/$/g, '')
}

export function normalizeSiteName(config: RuntimeConfig = {}): string {
  return toText(config.siteName, 'VanillaPress').trim() || 'VanillaPress'
}

export function isHomePageRel(
  rel: unknown,
  config: RuntimeConfig = {}
): boolean {
  const value = normalizeRel(rel) || 'index.html'
  if (value === 'index.html') return true

  const i18n = browserOption(config, 'i18n') as
    | { locales?: LocalePathItem[] }
    | undefined
  const locales =
    i18n && typeof i18n === 'object' && Array.isArray(i18n.locales)
      ? (i18n.locales as LocalePathItem[])
      : []

  return locales.some((locale) => {
    const prefix = normalizeRel(locale?.path)
    return Boolean(prefix) && value === `${prefix}/index.html`
  })
}

export function documentTitle(
  title: unknown,
  config: RuntimeConfig = {},
  rel?: unknown
): string {
  const pageTitleValue = toText(title).trim()
  const siteName = normalizeSiteName(config)
  if (rel !== undefined && isHomePageRel(rel, config)) return siteName
  return pageTitleValue ? `${pageTitleValue} - ${siteName}` : siteName
}

export function excerptText(text = '', maxLength = 180): string {
  const value = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength).trim()}...`
}
