import { all } from 'vanilla-jui'
import { createEffect, jsx } from 'vanilla-signal'

import type {
  DocConfig,
  DocI18n,
  LanguagesConfig,
  LocaleEntry,
  RuntimeI18nConfig,
  RuntimePage,
} from '../types.ts'
import { isRecord } from '../types.ts'
import { isI18nEnabled, runtimeOption } from '../utilities/features.ts'
import {
  AUTO_LOCALE,
  defaultLocaleRoute,
  isLocaleRoute,
  localeRouteForCode,
  localeRouteValues,
} from '../utilities/i18n-routes.ts'
import { toText } from '../utilities/string.ts'
import { currentLocale, joinLocalePath, pageWithoutLocale } from './i18n.ts'
import { localeCode, relativeAsset } from './path.ts'
import {
  ensurePreference,
  readPreference,
  updatePreference,
} from './preference.ts'

function i18nOptions(config: DocConfig): RuntimeI18nConfig {
  const value = runtimeOption(config, 'i18n')
  return isRecord(value) ? (value as RuntimeI18nConfig) : {}
}

function hasLocalePrefix(rel: string, locales: LocaleEntry[]): boolean {
  return locales.some((locale) => {
    const prefix = String(locale?.path || '')
      .replace(/^\/+/, '')
      .replace(/\/+$/g, '')
    return (
      prefix && (rel === `${prefix}/index.html` || rel.startsWith(`${prefix}/`))
    )
  })
}

function defaultLocale(
  languages: LanguagesConfig = {},
  config: DocConfig = {}
): LocaleEntry | null {
  const locales = Array.isArray(languages.locales) ? languages.locales : []
  if (!locales.length) return null

  const i18n = i18nOptions(config)
  const preferred = i18n.locale || languages.locale
  const preferredCode = localeCode(preferred)
  return (
    locales.find((locale) => localeCode(locale.code) === preferredCode) ||
    locales[0]
  )
}

function redirectEnabled(config: DocConfig = {}): boolean {
  return i18nOptions(config).redirectToDefault !== false
}

function localeForRoute(
  route: unknown,
  languages: LanguagesConfig = {},
  config: DocConfig = {}
): LocaleEntry | null {
  const i18n = i18nOptions(config)
  const value = toText(route)
  const locales = Array.isArray(languages.locales) ? languages.locales : []
  return (
    locales.find(
      (locale) => localeRouteForCode(locale?.code, i18n, languages) === value
    ) || defaultLocale(languages, config)
  )
}

function syncLocalePreference(
  config: DocConfig = {},
  languages: LanguagesConfig = {},
  locale: LocaleEntry | null = null
): void {
  if (!isI18nEnabled(config) || !redirectEnabled(config)) return

  const i18n = i18nOptions(config)
  const routes = localeRouteValues(i18n, languages)
  const current = readPreference()
  if (!routes.length) {
    updatePreference({ locale: AUTO_LOCALE })
    return
  }
  if (current?.locale === AUTO_LOCALE) return
  if (current?.locale && isLocaleRoute(current.locale, i18n, languages)) return

  updatePreference({
    locale:
      localeRouteForCode(locale?.code, i18n, languages) ||
      defaultLocaleRoute(i18n, languages),
  })
}

export function maybeRedirectToDefaultLocale(
  config: DocConfig = {},
  languages: LanguagesConfig = {},
  page: RuntimePage = {}
): boolean {
  if (!isI18nEnabled(config)) return false
  if (!redirectEnabled(config)) return false

  const i18n = i18nOptions(config)
  const locales = Array.isArray(languages.locales) ? languages.locales : []
  const routes = localeRouteValues(i18n, languages)
  if (!routes.length) {
    updatePreference({ locale: AUTO_LOCALE })
    return false
  }

  const rel = String(page.rel || 'index.html')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/')
  if (hasLocalePrefix(rel, locales)) return false

  const preference = ensurePreference()
  let route = typeof preference.locale === 'string' ? preference.locale : ''
  if (!route) {
    route = defaultLocaleRoute(i18n, languages)
    updatePreference({ locale: route })
  }
  if (route === AUTO_LOCALE) return false
  if (!isLocaleRoute(route, i18n, languages)) {
    route = defaultLocaleRoute(i18n, languages)
    updatePreference({ locale: route })
  }

  const locale = localeForRoute(route, languages, config)
  if (!locale) return false

  const targetRel = joinLocalePath(locale, rel)
  if (!targetRel || targetRel === rel) return false

  const targetHref = relativeAsset(rel, targetRel)
  const { search, hash } = window.location
  window.location.replace(`${targetHref}${search}${hash}`)
  return true
}

export function initLocale(
  languages: LanguagesConfig = {},
  page: RuntimePage = {},
  i18n: DocI18n,
  config: DocConfig = {}
): void {
  if (!isI18nEnabled(config)) {
    all<HTMLSelectElement>('[data-vp-locale]').forEach((select) => {
      select.hidden = true
      select.dataset.vpReady = 'true'
    })
    return
  }

  const selects = all<HTMLSelectElement>('[data-vp-locale]').filter(
    (select) => select.dataset.vpReady !== 'true'
  )
  const locales = Array.isArray(languages.locales) ? languages.locales : []
  if (!selects.length || !locales.length) return

  const i18nConfig = i18nOptions(config)
  const initialLocale = currentLocale(languages, page)
  syncLocalePreference(config, languages, initialLocale)

  selects.forEach((select) => {
    select.textContent = ''

    for (const locale of locales) {
      select.append(
        jsx('option', {
          value: localeCode(locale.code),
          children: locale.label || locale.code,
        })
      )
    }

    select.addEventListener('change', () => {
      const nextLocale = locales.find(
        (locale) => localeCode(locale.code) === select.value
      )
      if (!nextLocale) return

      if (redirectEnabled(config)) {
        updatePreference({
          locale:
            localeRouteForCode(nextLocale.code, i18nConfig, languages) ||
            defaultLocaleRoute(i18nConfig, languages),
        })
      }
      i18n.setLocale(String(nextLocale.code || ''))
      const baseRel = pageWithoutLocale(page.rel, initialLocale)
      const nextRel = joinLocalePath(nextLocale, baseRel)
      window.location.href = relativeAsset(page.rel, nextRel)
    })

    select.dataset.vpReady = 'true'
  })

  createEffect(() => {
    selects.forEach((select) => {
      select.value = localeCode(i18n.getLocale())
    })
  })
}
