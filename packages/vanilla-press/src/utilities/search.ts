import type { LanguagesConfig, LocaleEntry } from '../types.ts'
import { normalizePath } from './path.ts'

function safeSearchSegment(value: string): string {
  return (
    value
      .replace(/\//g, '.')
      .replace(/[^A-Za-z0-9._-]/g, '-')
      .replace(/^-+|-+$/g, '') || 'default'
  )
}

export function searchIndexFileName(route = ''): string {
  const value = normalizePath(route)
  return value ? `search.${safeSearchSegment(value)}.js` : 'search.js'
}

export function searchLocaleRoutes(languages: LanguagesConfig = {}): string[] {
  const locales = Array.isArray(languages.locales) ? languages.locales : []
  return Array.from(
    new Set(
      locales
        .map((locale: LocaleEntry) => normalizePath(locale?.path))
        .filter(Boolean)
    )
  )
}

export function pageInSearchLocale(rel: string, route = ''): boolean {
  const prefix = normalizePath(route)
  if (!prefix) return true

  const pageRel = normalizePath(rel)
  return pageRel === `${prefix}/index.html` || pageRel.startsWith(`${prefix}/`)
}

export function searchIndexFileNameForPage(
  rel: string,
  languages: LanguagesConfig = {}
): string {
  const route = searchLocaleRoutes(languages).find((item) =>
    pageInSearchLocale(rel, item)
  )

  return searchIndexFileName(route || '')
}
