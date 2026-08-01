import { all, createModal, icon, randomId, isMobile } from 'vanilla-jui';
import { jsx } from 'vanilla-signal';

import { isSearchEnabled } from '../utilities/features.js';
import { localize } from './i18n.js';
import { normalizeRel, relativeAsset } from './path.js';

function translate(key, fallback, i18n) {
  const text = localize(key, i18n);
  return text && text !== key ? text : fallback;
}

function localePrefix(locale) {
  return normalizeRel(locale?.path || '');
}

function inCurrentLocale(item, locale) {
  const prefix = localePrefix(locale);
  if (!prefix) return true;
  const rel = normalizeRel(item.rel || '');
  return rel === `${prefix}/index.html` || rel.startsWith(`${prefix}/`);
}

function normalizeText(value = '') {
  return String(value).toLowerCase();
}

function scoreItem(item, query) {
  const needle = normalizeText(query);
  if (!needle) return 0;

  let score = 0;
  if (normalizeText(item.title).includes(needle)) score += 6;
  if (normalizeText(item.keywords).includes(needle)) score += 4;
  if (normalizeText(item.description).includes(needle)) score += 3;
  if (normalizeText(item.content).includes(needle)) score += 1;
  return score;
}

function searchItems(items, query) {
  const value = String(query || '').trim();
  if (!value) return [];

  return items
    .map((item) => ({ item, score: scoreItem(item, value) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title)
    )
    .slice(0, 12)
    .map((entry) => entry.item);
}

function searchLoader(source) {
  if (typeof source === 'function') return source;
  return async () => source;
}

function normalizeSearchIndex(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.searchIndex)) return value.searchIndex;
  return [];
}

function createSearchPanel({ items, page, i18n, onNavigate }) {
  let lg = '';
  let pd = {};
  if (isMobile()) {
    lg = 'is-lg';
    pd = { padding: '4px 2rem 2rem' };
  }
  const input = jsx('input', {
    className: `j-input ${lg} doc-search-input`,
    id: randomId(),
    type: 'search',
    autocomplete: 'off',
    placeholder: translate('search.placeholder', '输入关键词...', i18n),
  });
  const results = jsx('div', { className: 'doc-search-results' });
  const panel = jsx('div', {
    className: 'doc-search-panel',
    style: pd,
    children: [input, results],
  });

  function renderEmpty(message) {
    results.textContent = '';
    results.append(
      jsx('p', {
        className: 'doc-search-empty',
        children: message,
      })
    );
  }

  function renderResults() {
    const query = input.value.trim();
    const matches = searchItems(items, query);
    results.textContent = '';

    if (!query) {
      renderEmpty(translate('search.hint', '输入关键词搜索标题和正文', i18n));
      return;
    }

    if (!matches.length) {
      renderEmpty(translate('search.empty', '没有找到匹配内容', i18n));
      return;
    }

    for (const item of matches) {
      results.append(
        jsx('a', {
          className: 'doc-search-result',
          href: relativeAsset(page.rel, item.rel),
          children: [
            jsx('strong', {
              className: 'doc-search-result-title',
              children: item.title || item.rel,
            }),
            jsx('span', {
              className: 'doc-search-result-excerpt',
              children: item.description || item.excerpt || item.rel,
            }),
          ],
        })
      );
    }
  }

  input.addEventListener('input', renderResults);
  results.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (link) onNavigate?.();
  });

  renderResults();

  return {
    panel,
    focus: () => input.focus(),
    reset: () => {
      input.value = '';
      renderResults();
    },
  };
}

export function initSearch(
  config = {},
  searchSource = [],
  page = {},
  i18n,
  locale = null
) {
  const buttons = all('[data-doc-search]').filter(
    (button) => button.dataset.docReady !== 'true'
  );
  if (!buttons.length) return;

  if (!isSearchEnabled(config)) {
    buttons.forEach((button) => {
      button.hidden = true;
      button.textContent = '';
      button.dataset.docReady = 'true';
    });
    return;
  }

  const loadSearch = searchLoader(searchSource);
  const buttonLabel = translate('search.button', '搜索', i18n);
  let itemsPromise = null;
  let modal = null;
  let panelApi = null;

  function loadItems() {
    itemsPromise ||= Promise.resolve(loadSearch())
      .then((value) =>
        normalizeSearchIndex(value).filter((item) =>
          inCurrentLocale(item, locale)
        )
      )
      .catch((error) => {
        console.error('[vanilla-press] failed to load search index', error);
        return [];
      });

    return itemsPromise;
  }

  async function ensureModal() {
    if (modal) return modal;

    panelApi = createSearchPanel({
      items: await loadItems(),
      page,
      i18n,
      onNavigate: () => modal?.hide(),
    });
    modal = createModal({
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
      onShown: () => panelApi.focus(),
    });

    return modal;
  }

  buttons.forEach((button) => {
    button.hidden = false;
    button.textContent = '';
    button.title = buttonLabel;
    button.setAttribute('aria-label', buttonLabel);
    button.append(icon('search', { className: 'el-icon el-prefix' }));
    button.addEventListener('click', async () => {
      button.disabled = true;
      panelApi?.reset();
      try {
        const nextModal = await ensureModal();
        nextModal.show();
      } finally {
        button.disabled = false;
      }
    });
    button.dataset.docReady = 'true';
  });
}
