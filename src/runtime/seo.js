import { normalizeSiteName } from "../utilities/page.js";
import { isSeoEnabled } from "../utilities/features.js";

function pageTitle(config = {}, page = {}) {
  const title = String(page.seo?.title || page.title || "").trim();
  return title ? `${title} - ${normalizeSiteName(config)}` : normalizeSiteName(config);
}

function syncMeta(name, content) {
  const value = String(content || "").trim();
  let meta = document.querySelector(`meta[data-doc-seo="${name}"]`);

  if (!value) {
    meta?.remove();
    return;
  }

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    meta.dataset.docSeo = name;
    document.head.append(meta);
  }

  meta.content = value;
}

export function initSeo(config = {}, page = {}) {
  if (!isSeoEnabled(config)) return;

  document.title = pageTitle(config, page);
  syncMeta("keywords", page.seo?.keywords);
  syncMeta("description", page.seo?.description);
}
