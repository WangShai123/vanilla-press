import {
  isI18nEnabled,
  isSearchEnabled,
  isThemeEnabled,
  runtimeOption,
} from "../utilities/features.js";
import { escapeHtml } from "../utilities/html.js";
import { documentTitle } from "../utilities/page.js";
import { normalizePath, relativeAsset } from "../utilities/path.js";
import { i18nRedirectBootScript } from "../utilities/i18n-routes.js";
import { renderHead } from "./template/head.js";
import { renderRuntimeScript } from "./template/runtime.js";

function resolveHtmlLang(rel, config = {}, languages = {}) {
  const i18n = runtimeOption(config, "i18n");
  const fallback =
    String(i18n?.locale || languages.locale || "zh-CN").trim() || "zh-CN";
  if (!isI18nEnabled(config)) return fallback;

  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  if (!locales.length) return fallback;

  const firstSegment = normalizePath(rel).split("/")[0]?.toLowerCase();
  const matched = locales.find(
    (locale) => normalizePath(locale?.path).toLowerCase() === firstSegment,
  );

  return String(matched?.code || fallback).trim() || fallback;
}

export function renderHtml({
  title,
  seo,
  body,
  rel,
  components,
  config,
  languages,
  pageLayout,
  searchEnabled = isSearchEnabled(config),
}) {
  const cssHref = relativeAsset(rel, "styles.css");
  const runtimeHref = relativeAsset(rel, "runtime.js");
  const searchHref = relativeAsset(rel, "search.js");
  const themeEnabled = isThemeEnabled(config);
  const themeDefault = runtimeOption(config, "theme")?.default;
  const i18n = runtimeOption(config, "i18n") || {};
  const i18nRedirectScript =
    isI18nEnabled(config) &&
    i18n.redirectToDefault !== false &&
    normalizePath(rel) === "index.html"
      ? i18nRedirectBootScript(i18n, languages)
      : "";
  const htmlLang = resolveHtmlLang(rel, config, languages);
  const htmlTitle = documentTitle(seo?.title || title, config);

  return `<!doctype html>
<html lang="${htmlLang}">
${renderHead({
  title: htmlTitle,
  seo,
  themeEnabled,
  themeDefault,
  i18nRedirectScript,
  cssHref,
})}
<body class="doc-layout-${pageLayout?.name || "default"}">
  ${pageLayout?.html || body}
  ${renderRuntimeScript({
    runtimeHref,
    searchHref,
    searchEnabled,
    components,
    title,
    rel,
    seo,
  })}
</body>
</html>
`;
}

export function renderDefaultLocaleEntrypoint({
  i18n = {},
  languages = {},
  lang = "en",
} = {}) {
  const i18nRedirectScript = i18nRedirectBootScript(i18n, languages);

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecting...</title>
  <script>${i18nRedirectScript}</script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>
`;
}
