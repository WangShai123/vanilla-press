import {
  all,
  createModal,
  icon,
  randomId,
  isMobile,
  type Modal,
} from 'vanilla-jui'
import { jsx } from 'vanilla-signal'

import type {
  DocConfig,
  DocI18n,
  LocaleEntry,
  RuntimePage,
  SearchIndexItem,
  SearchIndexPayload,
  SearchSource,
} from '../types.ts'
import { isRecord } from '../types.ts'
import { isSearchEnabled } from '../utilities/features.ts'
import { toText } from '../utilities/string.ts'
import { localize } from './i18n.ts'
import { normalizeRel, relativeAsset } from './path.ts'

type SearchPayload = SearchIndexItem[] | SearchIndexPayload
type SearchLoader = () => SearchPayload | Promise<SearchPayload>

interface SearchPanelOptions {
  items: SearchIndexItem[]
  page: RuntimePage
  i18n: DocI18n
  onNavigate?: () => void
}

interface SearchPanelApi {
  panel: HTMLElement
  focus(): void
  reset(): void
}

function translate(key: string, fallback: string, i18n: DocI18n): string {
  const text = localize(key, i18n)
  return text && text !== key ? text : fallback
}

function localePrefix(locale: LocaleEntry | null): string {
  return normalizeRel(locale?.path || '')
}

function inCurrentLocale(
  item: SearchIndexItem,
  locale: LocaleEntry | null
): boolean {
  const prefix = localePrefix(locale)
  if (!prefix) return true
  const rel = normalizeRel(item.rel || '')
  return rel === `${prefix}/index.html` || rel.startsWith(`${prefix}/`)
}

function normalizeText(value: unknown = ''): string {
  return String(value).toLowerCase()
}

function scoreItem(item: SearchIndexItem, query: string): number {
  const needle = normalizeText(query)
  if (!needle) return 0

  let score = 0
  if (normalizeText(item.title).includes(needle)) score += 6
  if (normalizeText(item.keywords).includes(needle)) score += 4
  if (normalizeText(item.description).includes(needle)) score += 3
  if (normalizeText(item.content).includes(needle)) score += 1
  return score
}

function searchItems(
  items: SearchIndexItem[],
  query: unknown
): SearchIndexItem[] {
  const value = toText(query).trim()
  if (!value) return []

  return items
    .map((item) => ({ item, score: scoreItem(item, value) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        String(a.item.title || '').localeCompare(String(b.item.title || ''))
    )
    .slice(0, 12)
    .map((entry) => entry.item)
}

function searchLoader(source: SearchSource = []): SearchLoader {
  if (typeof source === 'function') return source
  return async () => source
}

function normalizeSearchIndex(value: unknown): SearchIndexItem[] {
  if (Array.isArray(value)) return value as SearchIndexItem[]
  if (isRecord(value) && Array.isArray(value.searchIndex)) {
    return value.searchIndex as SearchIndexItem[]
  }
  return []
}

function createSearchPanel({
  items,
  page,
  i18n,
  onNavigate,
}: SearchPanelOptions): SearchPanelApi {
  let lg = ''
  let pd: Record<string, string> = {}
  if (isMobile()) {
    lg = 'is-lg'
    pd = { padding: '4px 2rem 2rem' }
  }
  const input = jsx('input', {
    className: `j-input ${lg} vp-search-input`,
    id: randomId(),
    type: 'search',
    autocomplete: 'off',
    placeholder: translate('search.placeholder', '输入关键词...', i18n),
  }) as HTMLInputElement
  const results = jsx('div', { className: 'vp-search-results' })
  const panel = jsx('div', {
    className: 'vp-search-panel',
    style: pd,
    children: [input, results],
  })

  function renderEmpty(message: string): void {
    results.textContent = ''
    results.append(
      jsx('p', {
        className: 'vp-search-empty',
        children: message,
      })
    )
  }

  function renderResults(): void {
    const query = input.value.trim()
    const matches = searchItems(items, query)
    results.textContent = ''

    if (!query) {
      renderEmpty(translate('search.hint', '输入关键词搜索标题和正文', i18n))
      return
    }

    if (!matches.length) {
      renderEmpty(translate('search.empty', '没有找到匹配内容', i18n))
      return
    }

    for (const item of matches) {
      results.append(
        jsx('a', {
          className: 'vp-search-result',
          href: relativeAsset(page.rel, item.rel),
          children: [
            jsx('strong', {
              className: 'vp-search-result-title',
              children: item.title || item.rel,
            }),
            jsx('span', {
              className: 'vp-search-result-excerpt',
              children: item.description || item.excerpt || item.rel,
            }),
          ],
        })
      )
    }
  }

  input.addEventListener('input', renderResults)
  results.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return
    const link = event.target.closest('a[href]')
    if (link) onNavigate?.()
  })

  renderResults()

  return {
    panel,
    focus: () => input.focus(),
    reset: () => {
      input.value = ''
      renderResults()
    },
  }
}

export function initSearch(
  config: DocConfig = {},
  searchSource: SearchSource = [],
  page: RuntimePage = {},
  i18n: DocI18n,
  locale: LocaleEntry | null = null
): void {
  const buttons = all<HTMLButtonElement>('[data-vp-search]').filter(
    (button) => button.dataset.vpReady !== 'true'
  )
  if (!buttons.length) return

  if (!isSearchEnabled(config)) {
    buttons.forEach((button) => {
      button.hidden = true
      button.textContent = ''
      button.dataset.vpReady = 'true'
    })
    return
  }

  const loadSearch = searchLoader(searchSource)
  const buttonLabel = translate('search.button', '搜索', i18n)
  let itemsPromise: Promise<SearchIndexItem[]> | null = null
  let modal: Modal | null = null
  let panelApi: SearchPanelApi | null = null

  function loadItems(): Promise<SearchIndexItem[]> {
    itemsPromise ||= Promise.resolve(loadSearch())
      .then((value) =>
        normalizeSearchIndex(value).filter((item) =>
          inCurrentLocale(item, locale)
        )
      )
      .catch((error) => {
        console.error('[vanilla-press] failed to load search index', error)
        return []
      })

    return itemsPromise
  }

  async function ensureModal(): Promise<Modal> {
    if (modal) return modal

    panelApi = createSearchPanel({
      items: await loadItems(),
      page,
      i18n,
      onNavigate: () => modal?.hide(),
    })
    modal = createModal({
      id: 'global-search',
      position: 'top-center',
      content: panelApi.panel,
      text: {
        title: translate('search.title', '搜索文档', i18n),
      },
      fullscreen: isMobile(),
      showCancel: false,
      footer: false,
      bgClose: true,
      escClose: true,
      style: { width: isMobile() ? '' : 'min(92vw, 640px)' },
      onShown: () => panelApi?.focus(),
    }).build()

    return modal
  }

  buttons.forEach((button) => {
    button.hidden = false
    button.textContent = ''
    button.title = buttonLabel
    button.setAttribute('aria-label', buttonLabel)
    button.append(icon('search', { className: 'el-icon el-prefix' }))
    button.addEventListener('click', async () => {
      button.disabled = true
      panelApi?.reset()
      try {
        const nextModal = await ensureModal()
        nextModal.show()
      } finally {
        button.disabled = false
      }
    })
    button.dataset.vpReady = 'true'
  })
}
