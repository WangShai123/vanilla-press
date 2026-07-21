import {
  isI18nEnabled,
  isSearchEnabled,
  isThemeEnabled,
  runtimeOption,
} from "../utilities/features.js";
import { escapeHtml } from "../utilities/html.js";
import { documentTitle } from "../utilities/page.js";
import { normalizePath, relativeAsset } from "../utilities/path.js";
import { renderHead } from "./template/head.js";
import { renderRuntimeScript } from "./template/runtime.js";

function resolveHtmlLang(rel, config = {}, languages = {}) {
  const i18n = runtimeOption(config, "i18n");
  const fallback =
    String(i18n?.defaultLocale || languages.locale || "zh-CN").trim() || "zh-CN";
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
  const htmlLang = resolveHtmlLang(rel, config, languages);
  const htmlTitle = documentTitle(seo?.title || title, config);

  return `<!doctype html>
<html lang="${htmlLang}">
${renderHead({ title: htmlTitle, seo, themeEnabled, cssHref })}
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

export function renderDefaultLocaleEntrypoint(target, lang = "en") {
  const safeTarget = JSON.stringify(`./${target}`);

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0; url=./${escapeHtml(target)}">
</head>
<body>
  <script>
    (function () {
      var target = ${safeTarget};
      var suffix = window.location.search + window.location.hash;
      window.location.replace(target + suffix);
    })();
  </script>
  <p>Redirecting to <a href="./${escapeHtml(target)}">./${escapeHtml(target)}</a> ...</p>
</body>
</html>
`;
}
