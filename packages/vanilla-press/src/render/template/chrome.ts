import icons from '../../config/icons.ts'
import {
  createDocI18n,
  currentLocale,
  joinLocalePath,
  localize,
} from '../../runtime/i18n.ts'
import { normalizeRel, relativeAsset } from '../../runtime/path.ts'
import { isRecord, type ChromeOptions, type NavItem } from '../../types.ts'
import { buildOption } from '../../utilities/features.ts'
import { escapeHtml } from '../../utilities/html.ts'
import { normalizeSiteName } from '../../utilities/page.ts'
import { toText } from '../../utilities/string.ts'

function attr(value: unknown): string {
  return escapeHtml(value)
}

function rawItemPath(item: NavItem = {}): unknown {
  return item.path ?? item.href ?? item.url ?? ''
}

function isExternalPath(value: unknown = ''): boolean {
  const itemPath = toText(value)
  return (
    /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(itemPath) || itemPath.startsWith('#')
  )
}

function normalizePagePath(value: unknown = ''): string {
  const itemPath = toText(value).trim()
  if (!itemPath || isExternalPath(itemPath)) return itemPath
  const clean = itemPath.replace(/^\/+/, '')
  if (clean.endsWith('/')) return `${clean}index.html`
  if (/\.[a-z0-9]+$/i.test(clean)) return clean
  return `${clean}.html`
}

function resolveItemHref(item: NavItem, options: ChromeOptions): string {
  const itemPath = rawItemPath(item)
  const href = normalizePagePath(itemPath)
  if (!href || isExternalPath(href)) return href

  const locale = currentLocale(options.languages, options.page)
  const localizedHref = locale ? joinLocalePath(locale, href) : href
  return relativeAsset(options.page.rel, localizedHref)
}

function menuItemIsActive(item: NavItem, options: ChromeOptions): boolean {
  const locale = currentLocale(options.languages, options.page)
  const itemPath = normalizePagePath(rawItemPath(item))
  const href =
    itemPath && !isExternalPath(itemPath)
      ? normalizeRel(locale ? joinLocalePath(locale, itemPath) : itemPath)
      : ''
  const rel = normalizeRel(options.page.rel || '')
  if (href && href === rel) return true
  return (
    Array.isArray(item.children) &&
    item.children.some((child) => menuItemIsActive(child, options))
  )
}

function renderMenuItem(item: NavItem, options: ChromeOptions): string {
  const i18n = createDocI18n(options.languages, options.page)
  const children = Array.isArray(item.children) ? item.children : []
  const active = menuItemIsActive(item, options)
  const classes = ['menu-item']
  const href = resolveItemHref(item, options)
  const text = localize(item.i18n || item.label || item.title, i18n)

  if (children.length) classes.push('menu-item-has-children')
  if (active) classes.push('current-menu-item')
  if (Array.isArray(item.classes)) classes.push(...item.classes)

  return `<li class="${attr(classes.join(' '))}">
        <a class="menu-link"${href ? ` href="${attr(href)}"` : ''}${item.target ? ` target="${attr(item.target)}"` : ''}>
          <span class="menu-text">${escapeHtml(text)}</span>
        </a>${
          children.length
            ? `
        <ul class="sub-menu">
${children.map((child) => renderMenuItem(child, options)).join('\n')}
        </ul>`
            : ''
        }
      </li>`
}

function renderHeaderMenu(options: ChromeOptions): string {
  if (!options.menuEnabled) return ''

  return `<nav class="vp-menu j-menu" data-vp-menu data-vp-ready="true" aria-label="主菜单">
    <ul class="menu">
${options.menuItems.map((item) => renderMenuItem(item, options)).join('\n')}
    </ul>
  </nav>`
}

function renderDesktopSearch(searchEnabled: boolean): string {
  return searchEnabled
    ? '<button class="vp-search-button j-button is-ghost is-icon" type="button" data-vp-search hidden aria-label="搜索"></button>'
    : ''
}

function renderDesktopLocale(i18nEnabled: boolean): string {
  return i18nEnabled
    ? '<select class="vp-locale j-select" data-vp-locale aria-label="切换语言" id="vp-locale-desktop"></select>'
    : ''
}

function renderDesktopTheme(themeEnabled: boolean): string {
  return themeEnabled
    ? '<button class="vp-theme-button j-button is-default" type="button" data-vp-theme hidden></button>'
    : ''
}

function renderDesktopAuth(authEnabled: boolean): string {
  return authEnabled
    ? '<button class="vp-auth-button j-button is-default" type="button" data-vp-auth hidden aria-label="登录"></button>'
    : ''
}

function renderDesktopHeader(options: ChromeOptions): string {
  const siteName = normalizeSiteName(options.config)
  const headerMenu = renderHeaderMenu(options)
  const desktopSearch = renderDesktopSearch(options.searchEnabled)
  const desktopLocale = renderDesktopLocale(options.i18nEnabled)
  const desktopTheme = renderDesktopTheme(options.themeEnabled)
  const desktopAuth = renderDesktopAuth(options.authEnabled)

  return `<div class="vp-header-inner" data-vp-desktop-header>
      <a class="vp-brand" data-vp-brand href="${attr(options.brandHref)}">${escapeHtml(siteName)}</a>
${headerMenu}
      <div class="vp-header-actions">
${desktopSearch}
${desktopLocale}
        ${desktopTheme}
        ${desktopAuth}
      </div>
    </div>`
}

function renderMobileMenu(menuEnabled: boolean): string {
  return menuEnabled
    ? '<button class="vp-mobile-icon-button j-button is-ghost is-icon" type="button" data-vp-mobile-menu aria-label="打开主菜单"></button>'
    : ''
}

function renderMobileSearch(searchEnabled: boolean): string {
  return searchEnabled
    ? '<button class="vp-search-button vp-mobile-icon-button j-button is-ghost is-icon" type="button" data-vp-search hidden aria-label="搜索"></button>'
    : ''
}

function renderMobileLocale(i18nEnabled: boolean): string {
  return i18nEnabled
    ? '<select class="vp-locale j-select" data-vp-locale aria-label="切换语言" id="vp-locale-mobile"></select>'
    : ''
}

function renderMobileTheme(themeEnabled: boolean): string {
  return themeEnabled
    ? '<button class="vp-theme-button vp-mobile-icon-button j-button is-ghost is-icon" type="button" data-vp-theme hidden aria-label="主题"></button>'
    : ''
}

function renderMobileAuth(authEnabled: boolean): string {
  return authEnabled
    ? '<button class="vp-auth-button vp-mobile-icon-button j-button is-ghost is-icon" type="button" data-vp-auth hidden aria-label="登录"></button>'
    : ''
}

function renderMobileHeader(options: ChromeOptions): string {
  const siteName = normalizeSiteName(options.config)
  const mobileMenu = renderMobileMenu(options.menuEnabled)
  const mobileSearch = renderMobileSearch(options.searchEnabled)
  const mobileLocale = renderMobileLocale(options.i18nEnabled)
  const mobileTheme = renderMobileTheme(options.themeEnabled)
  const mobileAuth = renderMobileAuth(options.authEnabled)

  return `<div class="vp-mobile-header" data-vp-mobile-header hidden>
      <div class="vp-mobile-header-main">
${mobileMenu}
        <a class="vp-brand" data-vp-brand href="${attr(options.brandHref)}">${escapeHtml(siteName)}</a>
      </div>
      <div class="vp-mobile-header-actions">
${mobileSearch}
${mobileLocale}
        ${mobileTheme}
        ${mobileAuth}
      </div>
    </div>`
}

function renderMobileSecondary({
  sidebarEnabled,
  tocEnabled,
}: Pick<ChromeOptions, 'sidebarEnabled' | 'tocEnabled'>): string {
  return sidebarEnabled || tocEnabled
    ? `<div class="vp-mobile-secondary" data-vp-mobile-secondary hidden>
      ${sidebarEnabled ? '<button class="vp-mobile-secondary-button j-button is-ghost is-sm" type="button" data-vp-mobile-sidebar aria-label="打开文档导航"></button>' : ''}
      ${tocEnabled ? '<button class="vp-mobile-secondary-button j-button is-ghost is-sm" type="button" data-vp-mobile-toc aria-label="打开页面目录"></button>' : ''}
    </div>`
    : ''
}

export function renderHeaderTemplates(options: ChromeOptions): string {
  const desktopHeader = renderDesktopHeader(options)
  const mobileHeader = renderMobileHeader(options)

  return `<template data-vp-desktop-chrome>
${desktopHeader}
  </template>
  <template data-vp-mobile-chrome>
${mobileHeader}
  </template>`
}

export function renderSecondaryTemplate(options: ChromeOptions): string {
  const mobileSecondary = renderMobileSecondary(options)
  if (!mobileSecondary) return ''

  return `<template data-vp-mobile-secondary-chrome>
${mobileSecondary}
  </template>`
}

function renderIcon(name: string): string {
  const content = icons[name as keyof typeof icons]
  if (!content) return ''
  return `<svg class="el-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${content}</svg>`
}

export function renderFooter(config = {}): string {
  const siteName = normalizeSiteName(config)
  const year = new Date().getFullYear()
  const siteUrl = toText((config as { siteUrl?: unknown }).siteUrl)
  const icpConfig = buildOption(config, 'icp')
  const socialValue = buildOption(config, 'social')
  const socialConfig = isRecord(socialValue) ? socialValue : {}
  const social = Object.entries(socialConfig)
    .map(([name, href]) => {
      const url = toText(href).trim()
      if (!url) return ''
      return `<a href="${attr(url)}" class="j-button is-icon is-sm is-ghost" target="_blank" rel="noreferrer noopener" aria-label="${attr(name)}" title="${attr(name)}">${renderIcon(name)}</a>`
    })
    .filter(Boolean)
    .join('')

  return `<div class="footer-info">
    <div>${siteUrl ? `<a href="${attr(siteUrl)}">${escapeHtml(siteName)}</a>` : escapeHtml(siteName)} © ${year}</div>
    ${icpConfig ? `<div><a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer noopener">${escapeHtml(icpConfig)}</a></div>` : ''}
    <div>BuiltBy <a href="https://app.jealer.com/vanilla-press/" target="_blank" title="VanillaPress">VanillaPress</a></div>
  </div>
  <div class="footer-social">${social}</div>`
}
