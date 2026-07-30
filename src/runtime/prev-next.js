import { icon, q } from "vanilla-jui";
import { jsx } from "vanilla-signal";
import { joinLocalePath, localize, pageWithoutLocale } from "./i18n.js";
import { normalizeRel, relativeAsset } from "./path.js";
import { isPrevNextEnabled } from "../utilities/features.js";

function rawItemPath(item = {}) {
  return item.path ?? item.href ?? item.url ?? "";
}

function isExternalPath(value = "") {
  return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(value) || value.startsWith("#");
}

function normalizePagePath(value = "") {
  const itemPath = String(value || "").trim();
  if (!itemPath || isExternalPath(itemPath)) return "";
  const clean = itemPath.replace(/^\/+/, "");
  if (clean.endsWith("/")) return `${clean}index.html`;
  if (/\.[a-z0-9]+$/i.test(clean)) return clean;
  return `${clean}.html`;
}

function flattenItems(items = [], i18n, result = []) {
  for (const item of items) {
    const rel = normalizePagePath(rawItemPath(item));
    if (rel) {
      result.push({
        rel,
        title: localize(item.i18n || item.label || item.title, i18n),
      });
    }

    if (Array.isArray(item.children)) {
      flattenItems(item.children, i18n, result);
    }
  }

  return result;
}

function resolveCurrentRel(page = {}, locale = null) {
  return pageWithoutLocale(page.rel, locale);
}

function translate(key, fallback, i18n) {
  const text = localize(key, i18n);
  return text && text !== key ? text : fallback;
}

function createLink(item, page, locale, direction, i18n) {
  return jsx("a", {
    className: `doc-prev-next-link is-${direction}`,
    href: relativeAsset(page.rel, locale ? joinLocalePath(locale, item.rel) : item.rel),
    children: [
      jsx("span", {
        className: "doc-prev-next-label",
        children: [
          direction === "prev"
            ? translate("prevNext.previous", "Previous", i18n)
            : translate("prevNext.next", "Next", i18n),
          icon(direction === "prev" ? "arrow-left" : "arrow-right", { className: "el-icon" }),
        ],
      }),
      jsx("strong", {
        className: "doc-prev-next-title",
        children: item.title,
      }),
    ],
  });
}

export function initPrevNext(config = {}, sidebar = [], page = {}, i18n, locale = null) {
  if (!isPrevNextEnabled(config)) return;

  const slot = q("[data-doc-prev-next]");
  if (!slot || slot.dataset.docPrevNextReady === "true") return;

  const items = flattenItems(sidebar, i18n);
  const current = resolveCurrentRel(page, locale);
  const index = items.findIndex((item) => normalizeRel(item.rel) === current);
  if (index < 0) return;

  const prev = items[index - 1] || null;
  const next = items[index + 1] || null;
  if (!prev && !next) return;

  const nav = jsx("nav", {
    className: "doc-prev-next",
    "data-doc-prev-next-ready": "true",
    "aria-label": "Previous and next pages",
    children: [
      prev ? createLink(prev, page, locale, "prev", i18n) : null,
      next ? createLink(next, page, locale, "next", i18n) : null,
    ],
  });

  slot.replaceWith(nav);
}
