import { q } from 'vanilla-jui'

import type {
  RuntimeConfig,
  DocI18n,
  LanguagesConfig,
  LocaleEntry,
  RuntimePage,
} from '../types.ts'
import { isI18nEnabled } from '../utilities/features.ts'
import { initAuth } from './auth.ts'
import { createDocI18n, currentLocale } from './i18n.ts'
import { initLocale, maybeRedirectToDefaultLocale } from './locale.ts'
import { initHeaderMenu, initMobileHeader, initSidebar } from './menu.ts'
import { initTheme } from './theme.ts'

type DocChromeState =
  | {
      i18n: null
      locale: null
      redirected: true
    }
  | {
      i18n: DocI18n
      locale: LocaleEntry | null
      redirected: false
    }

export function initDocChrome(
  config: RuntimeConfig = {},
  _menu: unknown[] = [],
  _sidebar: unknown[] = [],
  languages: LanguagesConfig = {},
  page: RuntimePage = {}
): DocChromeState {
  if (maybeRedirectToDefaultLocale(config, languages, page)) {
    return { i18n: null, locale: null, redirected: true }
  }

  const i18nEnabled = isI18nEnabled(config)
  const locale = i18nEnabled ? currentLocale(languages, page) : null
  const i18n = createDocI18n(languages, page)

  const asideCustom = q<HTMLElement>('[data-vp-aside-custom]')
  if (asideCustom && config.aside?.html) {
    asideCustom.innerHTML = config.aside.html
  }

  initHeaderMenu()
  initMobileHeader()
  initSidebar()
  if (i18nEnabled) initLocale(languages, page, i18n, config)
  initTheme(config, i18n)
  initAuth(config, i18n)

  return { i18n, locale, redirected: false }
}
