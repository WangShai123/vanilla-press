import { addIcons, iconHtml } from 'vanilla-jui'

import icons from '../config/icons.ts'
import { joinLocalePath, localize, pageWithoutLocale } from '../runtime/i18n.ts'
import { normalizeRel } from '../runtime/path.ts'
import type {
  DocI18n,
  LocaleEntry,
  NavItem,
  RuntimeConfig,
  RuntimePage,
} from '../types.ts'
import { isPrevNextEnabled } from './features.ts'
import { escapeHtml } from './html.ts'
import { relativeAsset } from './path.ts'
import { toText } from './string.ts'

addIcons(icons)

type PrevNextDirection = 'prev' | 'next'

interface PrevNextItem {
  rel: string
  title: string
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
  if (!itemPath || isExternalPath(itemPath)) return ''
  const clean = itemPath.replace(/^\/+/, '')
  if (clean.endsWith('/')) return `${clean}index.html`
  if (/\.[a-z0-9]+$/i.test(clean)) return clean
  return `${clean}.html`
}

function flattenItems(
  items: NavItem[],
  i18n: DocI18n,
  result: PrevNextItem[] = []
): PrevNextItem[] {
  for (const item of items) {
    const rel = normalizePagePath(rawItemPath(item))
    if (rel) {
      result.push({
        rel,
        title: localize(item.i18n || item.label || item.title, i18n),
      })
    }

    if (Array.isArray(item.children)) {
      flattenItems(item.children, i18n, result)
    }
  }

  return result
}

function translate(key: string, fallback: string, i18n: DocI18n): string {
  const text = localize(key, i18n)
  return text && text !== key ? text : fallback
}

function renderLink(
  item: PrevNextItem,
  page: RuntimePage,
  locale: LocaleEntry | null,
  direction: PrevNextDirection,
  i18n: DocI18n
): string {
  const href = relativeAsset(
    page.rel || 'index.html',
    locale ? joinLocalePath(locale, item.rel) : item.rel
  )
  const label =
    direction === 'prev'
      ? translate('prevNext.previous', 'Previous', i18n)
      : translate('prevNext.next', 'Next', i18n)
  const icon = iconHtml(
    direction === 'prev' ? 'arrow-left' : 'arrow-right'
  ).replace('<svg ', '<svg class="el-icon" ')

  return `<a class="vp-prev-next-link is-${direction}" href="${escapeHtml(href)}">
    <span class="vp-prev-next-label"><span>${escapeHtml(label)}</span>${icon}</span>
    <strong class="vp-prev-next-title">${escapeHtml(item.title)}</strong>
  </a>`
}

export function renderPrevNext(
  config: RuntimeConfig = {},
  sidebar: NavItem[] = [],
  page: RuntimePage = {},
  i18n: DocI18n,
  locale: LocaleEntry | null = null
): string {
  if (!isPrevNextEnabled(config)) return ''

  const items = flattenItems(sidebar, i18n)
  const current = pageWithoutLocale(page.rel, locale)
  const index = items.findIndex((item) => normalizeRel(item.rel) === current)
  if (index < 0) return ''

  const prev = items[index - 1] || null
  const next = items[index + 1] || null
  if (!prev && !next) return ''

  return `<nav class="vp-prev-next" data-vp-prev-next-ready="true" aria-label="Previous and next pages">
    ${prev ? renderLink(prev, page, locale, 'prev', i18n) : ''}
    ${next ? renderLink(next, page, locale, 'next', i18n) : ''}
  </nav>`
}
