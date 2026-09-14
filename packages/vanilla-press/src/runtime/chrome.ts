import { q } from 'vanilla-jui'

import type {
  RuntimeConfig,
  DocI18n,
  LanguagesConfig,
  LocaleEntry,
  NavItem,
  RuntimePage,
} from '../types.ts'
import {
  isI18nEnabled,
  isMenuEnabled,
  isSidebarEnabled,
} from '../utilities/features.ts'
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
  menu: NavItem[] = [],
  sidebar: NavItem[] = [],
  languages: LanguagesConfig = {},
  page: RuntimePage = {},
  mobile = false
): DocChromeState {
  if (maybeRedirectToDefaultLocale(config, languages, page)) {
    return { i18n: null, locale: null, redirected: true }
  }

  const i18nEnabled = isI18nEnabled(config)
  const locale = i18nEnabled ? currentLocale(languages, page) : null
  const i18n = createDocI18n(languages, page)

  const desktopHeader = q<HTMLElement>('[data-vp-desktop-header]')
  const mobileHeader = q<HTMLElement>('[data-vp-mobile-header]')
  if (desktopHeader) desktopHeader.hidden = mobile
  if (mobileHeader) mobileHeader.hidden = !mobile

  const asideCustom = q<HTMLElement>('[data-vp-aside-custom]')
  if (asideCustom && config.aside?.html) {
    asideCustom.innerHTML = config.aside.html
  }

  if (mobile && isMenuEnabled(config)) {
    initMobileHeader(menu, page, i18n, locale)
  } else if (!mobile) {
    if (isMenuEnabled(config)) initHeaderMenu(menu, page, i18n, locale)
    if (isSidebarEnabled(config)) initSidebar(sidebar, page, i18n, locale)
  }
  if (i18nEnabled) initLocale(languages, page, i18n, config)
  initTheme(config, i18n)
  initAuth(config, i18n)

  return { i18n, locale, redirected: false }
}
