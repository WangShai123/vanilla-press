import icons from '../../config/icons.ts'
import { currentLocale } from '../../runtime/i18n.ts'
import { isRecord, type ChromeOptions } from '../../types.ts'
import { serverOption } from '../../utilities/features.ts'
import { escapeHtml } from '../../utilities/html.ts'
import { normalizeSiteName } from '../../utilities/page.ts'
import { toText } from '../../utilities/string.ts'
import { renderMenuList, renderTreeNav } from './navigation.ts'

function attr(value: unknown): string {
  return escapeHtml(value)
}

function renderHeaderMenu(options: ChromeOptions): string {
  if (!options.menuEnabled) return ''

  return `<nav class="vp-menu j-menu" data-vp-menu data-vp-ready="true" aria-label="主菜单">
    ${renderMenuList(options)}
  </nav>`
}

function renderSearch(searchEnabled: boolean): string {
  return searchEnabled
    ? '<button class="j-button is-ghost is-icon" type="button" data-vp-search hidden aria-label="搜索"></button>'
    : ''
}

function renderLocale(i18nEnabled: boolean): string {
  return i18nEnabled
    ? '<select class="vp-locale j-select" data-vp-locale aria-label="切换语言" id="vp-locale"></select>'
    : ''
}

function renderTheme(themeEnabled: boolean): string {
  return themeEnabled
    ? '<button class="j-button is-ghost is-icon" type="button" data-vp-theme hidden aria-label="主题"></button>'
    : ''
}

function renderAuth(authEnabled: boolean): string {
  return authEnabled
    ? '<button class="vp-auth-button j-button is-default" type="button" data-vp-auth hidden aria-label="登录"></button>'
    : ''
}

function renderMenuButton(menuEnabled: boolean): string {
  return menuEnabled
    ? '<button class="vp-header-icon-button vp-header-menu-toggle j-button is-ghost is-icon" type="button" data-vp-mobile-menu aria-label="打开主菜单"></button>'
    : ''
}

function renderSidebarButton(sidebarEnabled: boolean): string {
  return sidebarEnabled
    ? '<button class="vp-header-nav-button j-button is-ghost is-sm" type="button" data-vp-mobile-sidebar aria-label="打开文档导航"></button>'
    : ''
}

function renderTocButton(tocEnabled: boolean): string {
  return tocEnabled
    ? '<button class="vp-header-nav-button j-button is-ghost is-sm" type="button" data-vp-mobile-toc aria-label="打开页面目录"></button>'
    : ''
}

export function renderHeaderDocNav(options: ChromeOptions): string {
  const sidebarButton = renderSidebarButton(options.sidebarEnabled)
  const tocButton = renderTocButton(options.tocEnabled)
  if (!sidebarButton && !tocButton) return ''

  return `<div class="vp-header-doc-nav" data-vp-doc-nav>
      <div class="vp-header-doc-nav-start">${sidebarButton}</div>
      <div class="vp-header-doc-nav-end">${tocButton}</div>
    </div>`
}

function renderHeader(options: ChromeOptions): string {
  const siteName = normalizeSiteName(options.config)
  const headerMenu = renderHeaderMenu(options)
  const menuButton = renderMenuButton(options.menuEnabled)
  const search = renderSearch(options.searchEnabled)
  const socialList = renderSocialList(options.config)
  const locale = renderLocale(options.i18nEnabled)
  const theme = renderTheme(options.themeEnabled)
  const auth = renderAuth(options.authEnabled)

  return `<div class="vp-header-inner" data-vp-header>
      <div class="vp-header-main">
${menuButton}
      <a class="vp-brand" data-vp-brand href="${attr(options.brandHref)}">${escapeHtml(siteName)}</a>
      </div>
${headerMenu}
      <div class="vp-header-actions">
${search}
${socialList}
${theme}
${locale}
${auth}
      </div>
    </div>`
}

function renderMobileMenuContent(options: ChromeOptions): string {
  if (!options.menuEnabled) return ''

  const locale = currentLocale(options.languages, options.page)
  return `<div data-vp-mobile-menu-content hidden>
    <div class="vp-mobile-menu-panel">
      ${renderTreeNav(options.menuItems, options.page, options.i18n, locale, ' data-vp-mobile-menu-nav')}
    </div>
  </div>`
}

export function renderHeaderTemplates(options: ChromeOptions): string {
  const header = renderHeader(options)
  const mobileMenuContent = renderMobileMenuContent(options)

  return `${header}
${mobileMenuContent}`
}

function renderIcon(name: string): string {
  const content = icons[name as keyof typeof icons]
  if (!content) return ''
  return `<svg class="el-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${content}</svg>`
}

export function renderFooterInfo(config = {}): string {
  const siteName = normalizeSiteName(config)
  const year = new Date().getFullYear()
  const siteUrl = toText((config as { siteUrl?: unknown }).siteUrl)
  const icpConfig = serverOption(config, 'icp')

  return `<div class="footer-info" data-footer-info>
    <div>${siteUrl ? `<a href="${attr(siteUrl)}">${escapeHtml(siteName)}</a>` : escapeHtml(siteName)} © ${year}</div>
    ${icpConfig ? `<div><a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer noopener">${escapeHtml(icpConfig)}</a></div>` : ''}
    <div>BuiltBy <a href="https://app.jealer.com/vanilla-press/" target="_blank" title="VanillaPress">VanillaPress</a></div>
  </div>`
}

export function renderSocialList(config = {}): string {
  const socialValue = serverOption(config, 'social')
  const socialConfig = isRecord(socialValue) ? socialValue : {}
  const social = Object.entries(socialConfig)
    .map(([name, href]) => {
      const url = toText(href).trim()
      if (!url) return ''
      return `<a href="${attr(url)}" class="j-button is-icon is-sm is-ghost" target="_blank" rel="noreferrer noopener" aria-label="${attr(name)}" title="${attr(name)}">${renderIcon(name)}</a>`
    })
    .filter(Boolean)
    .join('')

  return social ? `<div class="social-list">${social}</div>` : ''
}
