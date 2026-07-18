import { icon } from "vanilla-jui";
import { joinLocalePath, localize, pageWithoutLocale } from "./i18n.js";
import { normalizeRel, relativeAsset } from "./path.js";

function isPrevNextEnabled(config = {}) {
  return config.prevNext === true || config.prevNext?.enabled === true;
}

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
  const link = document.createElement("a");
  link.className = `doc-prev-next-link is-${direction}`;
  link.href = relativeAsset(page.rel, locale ? joinLocalePath(locale, item.rel) : item.rel);

  const label = document.createElement("span");
  label.className = "doc-prev-next-label";
  label.textContent =
    direction === "prev"
      ? translate("prevNext.previous", "Previous", i18n)
      : translate("prevNext.next", "Next", i18n);

  const title = document.createElement("strong");
  title.className = "doc-prev-next-title";
  title.textContent = item.title;

  link.append(
    icon(direction === "prev" ? "arrow-left" : "arrow-right", { className: "el-icon" }),
    label,
    title,
  );

  return link;
}

export function initPrevNext(config = {}, sidebar = [], page = {}, i18n, locale = null) {
  if (!isPrevNextEnabled(config)) return;

  const article = document.querySelector(".j-content");
  if (!article || article.dataset.docPrevNextReady === "true") return;

  const items = flattenItems(sidebar, i18n);
  const current = resolveCurrentRel(page, locale);
  const index = items.findIndex((item) => normalizeRel(item.rel) === current);
  if (index < 0) return;

  const prev = items[index - 1] || null;
  const next = items[index + 1] || null;
  if (!prev && !next) return;

  const nav = document.createElement("nav");
  nav.className = "doc-prev-next";
  nav.setAttribute("aria-label", "Previous and next pages");
  if (prev) nav.append(createLink(prev, page, locale, "prev", i18n));
  if (next) nav.append(createLink(next, page, locale, "next", i18n));

  article.after(nav);
  article.dataset.docPrevNextReady = "true";
}
