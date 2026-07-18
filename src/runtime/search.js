import { createModal, icon } from "vanilla-jui";
import { localize } from "./i18n.js";
import { normalizeRel, relativeAsset } from "./path.js";

function isSearchEnabled(config = {}) {
  return config.search !== false;
}

function translate(key, fallback, i18n) {
  const text = localize(key, i18n);
  return text && text !== key ? text : fallback;
}

function localePrefix(locale) {
  return normalizeRel(locale?.path || "");
}

function inCurrentLocale(item, locale) {
  const prefix = localePrefix(locale);
  if (!prefix) return true;
  const rel = normalizeRel(item.rel || "");
  return rel === `${prefix}/index.html` || rel.startsWith(`${prefix}/`);
}

function normalizeText(value = "") {
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
  const value = String(query || "").trim();
  if (!value) return [];

  return items
    .map((item) => ({ item, score: scoreItem(item, value) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, 12)
    .map((entry) => entry.item);
}

function createSearchPanel({ items, page, i18n, onNavigate }) {
  const panel = document.createElement("div");
  panel.className = "doc-search-panel";

  const input = document.createElement("input");
  input.className = "j-input doc-search-input";
  input.type = "search";
  input.autocomplete = "off";
  input.placeholder = translate("search.placeholder", "输入关键词...", i18n);

  const results = document.createElement("div");
  results.className = "doc-search-results";

  function renderEmpty(message) {
    results.textContent = "";
    const empty = document.createElement("p");
    empty.className = "doc-search-empty";
    empty.textContent = message;
    results.append(empty);
  }

  function renderResults() {
    const query = input.value.trim();
    const matches = searchItems(items, query);
    results.textContent = "";

    if (!query) {
      renderEmpty(translate("search.hint", "输入关键词搜索标题和正文", i18n));
      return;
    }

    if (!matches.length) {
      renderEmpty(translate("search.empty", "没有找到匹配内容", i18n));
      return;
    }

    for (const item of matches) {
      const link = document.createElement("a");
      link.className = "doc-search-result";
      link.href = relativeAsset(page.rel, item.rel);

      const title = document.createElement("strong");
      title.className = "doc-search-result-title";
      title.textContent = item.title || item.rel;

      const excerpt = document.createElement("span");
      excerpt.className = "doc-search-result-excerpt";
      excerpt.textContent = item.description || item.excerpt || item.rel;

      link.append(title, excerpt);
      results.append(link);
    }
  }

  input.addEventListener("input", renderResults);
  results.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (link) onNavigate?.();
  });

  panel.append(input, results);
  renderResults();

  return {
    panel,
    focus: () => input.focus(),
    reset: () => {
      input.value = "";
      renderResults();
    },
  };
}

export function initSearch(config = {}, searchIndex = [], page = {}, i18n, locale = null) {
  const buttons = Array.from(document.querySelectorAll("[data-doc-search]")).filter(
    (button) => button.dataset.docReady !== "true",
  );
  if (!buttons.length) return;

  if (!isSearchEnabled(config)) {
    buttons.forEach((button) => {
      button.hidden = true;
      button.textContent = "";
      button.dataset.docReady = "true";
    });
    return;
  }

  const items = searchIndex.filter((item) => inCurrentLocale(item, locale));
  const buttonLabel = translate("search.button", "搜索", i18n);
  let modal = null;
  let panelApi = null;

  function ensureModal() {
    if (modal) return modal;

    panelApi = createSearchPanel({
      items,
      page,
      i18n,
      onNavigate: () => modal?.hide(),
    });
    modal = createModal({
      position: "top-center",
      content: panelApi.panel,
      text: {
        title: translate("search.title", "搜索文档", i18n),
      },
      showCancel: false,
      footer: false,
      bgClose: true,
      escClose: true,
      style: { width: "min(92vw, 640px)" },
      onShown: () => panelApi.focus(),
    });

    return modal;
  }

  buttons.forEach((button) => {
    button.hidden = false;
    button.textContent = "";
    button.title = buttonLabel;
    button.setAttribute("aria-label", buttonLabel);
    button.append(icon("search", { className: "el-icon el-prefix" }));
    button.addEventListener("click", () => {
      panelApi?.reset();
      ensureModal().show();
    });
    button.dataset.docReady = "true";
  });
}
