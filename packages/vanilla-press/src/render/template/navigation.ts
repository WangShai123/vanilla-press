import { addIcons, iconHtml } from 'vanilla-jui'

import icons from '../../config/icons.ts'
import { currentLocale, joinLocalePath, localize } from '../../runtime/i18n.ts'
import { normalizeRel, relativeAsset } from '../../runtime/path.ts'
import type {
  ChromeOptions,
  DocI18n,
  LocaleEntry,
  NavItem,
  RuntimePage,
} from '../../types.ts'
import { escapeHtml } from '../../utilities/html.ts'
import { toText } from '../../utilities/string.ts'

addIcons(icons)

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

export function resolveNavItemHref(
  item: NavItem,
  page: RuntimePage,
  locale: LocaleEntry | null
): string {
  const itemPath = rawItemPath(item)
  const href = normalizePagePath(itemPath)
  if (!href || isExternalPath(href)) return href

  const localizedHref = locale ? joinLocalePath(locale, href) : href
  return relativeAsset(page.rel, localizedHref)
}

export function navItemIsActive(
  item: NavItem,
  page: RuntimePage,
  locale: LocaleEntry | null
): boolean {
  const itemPath = normalizePagePath(rawItemPath(item))
  const href =
    itemPath && !isExternalPath(itemPath)
      ? normalizeRel(locale ? joinLocalePath(locale, itemPath) : itemPath)
      : ''
  const rel = normalizeRel(page.rel || '')
  if (href && href === rel) return true
  return (
    Array.isArray(item.children) &&
    item.children.some((child) => navItemIsActive(child, page, locale))
  )
}

function renderMenuItem(item: NavItem, options: ChromeOptions): string {
  const locale = currentLocale(options.languages, options.page)
  const i18n = options.i18n
  const children = Array.isArray(item.children) ? item.children : []
  const active = navItemIsActive(item, options.page, locale)
  const classes = ['menu-item']
  const href = resolveNavItemHref(item, options.page, locale)
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

export function renderMenuList(options: ChromeOptions): string {
  return `<ul class="menu">
${options.menuItems.map((item) => renderMenuItem(item, options)).join('\n')}
    </ul>`
}

function renderTreeNavItem(
  item: NavItem,
  page: RuntimePage,
  i18n: DocI18n,
  locale: LocaleEntry | null
): string {
  const children = Array.isArray(item.children) ? item.children : []
  const active = navItemIsActive(item, page, locale)
  const collapsed = children.length && item.collapse === true && !active
  const classes = ['vp-nav-item']
  const href = resolveNavItemHref(item, page, locale)
  const titleText = localize(item.i18n || item.label || item.title, i18n)

  if (children.length) classes.push('has-children')
  if (active) classes.push('is-active')
  if (collapsed) classes.push('is-collapsed')

  return `<div class="${attr(classes.join(' '))}">
      <a class="vp-nav-title${active ? ' is-active' : ''}"${href ? ` href="${attr(href)}"` : ''}>${escapeHtml(titleText)}</a>${
        children.length
          ? `
      <button class="vp-nav-toggle" type="button" aria-label="${attr(titleText)}" aria-expanded="${String(!collapsed)}">
        ${iconHtml('arrow-down')}
      </button>
      <div class="vp-nav-children"${collapsed ? ' hidden' : ''}>
${children.map((child) => renderTreeNavItem(child, page, i18n, locale)).join('\n')}
      </div>`
          : ''
      }
    </div>`
}

export function renderTreeNav(
  items: NavItem[] = [],
  page: RuntimePage = {},
  i18n: DocI18n,
  locale: LocaleEntry | null,
  attrs = ''
): string {
  return `<nav class="vp-nav"${attrs} aria-label="文档导航">
${items.map((item) => renderTreeNavItem(item, page, i18n, locale)).join('\n')}
    </nav>`
}
