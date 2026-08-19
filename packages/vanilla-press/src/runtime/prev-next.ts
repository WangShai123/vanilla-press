import { icon, q } from 'vanilla-jui'
import { jsx } from 'vanilla-signal'

import type {
  RuntimeConfig,
  DocI18n,
  LocaleEntry,
  NavItem,
  RuntimePage,
} from '../types.ts'
import { isPrevNextEnabled } from '../utilities/features.ts'
import { toText } from '../utilities/string.ts'
import { joinLocalePath, localize, pageWithoutLocale } from './i18n.ts'
import { normalizeRel, relativeAsset } from './path.ts'

type PrevNextDirection = 'prev' | 'next'

interface PrevNextItem {
  rel: string
  title: string
}

function rawItemPath(item: NavItem = {}): unknown {
  return item.path ?? item.href ?? item.url ?? ''
}

function isExternalPath(value: unknown = ''): boolean {
  const path = toText(value)
  return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(path) || path.startsWith('#')
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

function resolveCurrentRel(
  page: RuntimePage = {},
  locale: LocaleEntry | null = null
): string {
  return pageWithoutLocale(page.rel, locale)
}

function translate(key: string, fallback: string, i18n: DocI18n): string {
  const text = localize(key, i18n)
  return text && text !== key ? text : fallback
}

function createLink(
  item: PrevNextItem,
  page: RuntimePage,
  locale: LocaleEntry | null,
  direction: PrevNextDirection,
  i18n: DocI18n
): HTMLElement {
  return jsx('a', {
    className: `vp-prev-next-link is-${direction}`,
    href: relativeAsset(
      page.rel,
      locale ? joinLocalePath(locale, item.rel) : item.rel
    ),
    children: [
      jsx('span', {
        className: 'vp-prev-next-label',
        children: [
          direction === 'prev'
            ? translate('prevNext.previous', 'Previous', i18n)
            : translate('prevNext.next', 'Next', i18n),
          icon(direction === 'prev' ? 'arrow-left' : 'arrow-right', {
            className: 'el-icon',
          }),
        ],
      }),
      jsx('strong', {
        className: 'vp-prev-next-title',
        children: item.title,
      }),
    ],
  })
}

export function initPrevNext(
  config: RuntimeConfig = {},
  sidebar: NavItem[] = [],
  page: RuntimePage = {},
  i18n: DocI18n,
  locale: LocaleEntry | null = null
): void {
  if (!isPrevNextEnabled(config)) return

  const slot = q<HTMLElement>('[data-vp-prev-next]')
  if (!slot || slot.dataset.vpPrevNextReady === 'true') return

  const items = flattenItems(sidebar, i18n)
  const current = resolveCurrentRel(page, locale)
  const index = items.findIndex((item) => normalizeRel(item.rel) === current)
  if (index < 0) return

  const prev = items[index - 1] || null
  const next = items[index + 1] || null
  if (!prev && !next) return

  const nav = jsx('nav', {
    className: 'vp-prev-next',
    'data-vp-prev-next-ready': 'true',
    'aria-label': 'Previous and next pages',
    children: [
      prev ? createLink(prev, page, locale, 'prev', i18n) : null,
      next ? createLink(next, page, locale, 'next', i18n) : null,
    ],
  })

  slot.replaceWith(nav)
}
