import type {
  DocConfig,
  LanguagesConfig,
  PageLayout,
  RuntimeI18nConfig,
  SeoData,
} from '../types.ts';
import { isRecord } from '../types.ts';
import {
  isI18nEnabled,
  isSearchEnabled,
  isThemeEnabled,
  runtimeOption,
} from '../utilities/features.ts';
import { escapeHtml } from '../utilities/html.ts';
import { i18nRedirectBootScript } from '../utilities/i18n-routes.ts';
import { documentTitle } from '../utilities/page.ts';
import { normalizePath, relativeAsset } from '../utilities/path.ts';
import { renderHead } from './template/head.ts';
import { renderRuntimeScript } from './template/runtime.ts';

interface RenderHtmlOptions {
  title: string;
  seo: SeoData;
  body: string;
  rel: string;
  components: string[];
  config: DocConfig;
  languages: LanguagesConfig;
  pageLayout: PageLayout;
  searchEnabled?: boolean;
}

interface DefaultLocaleEntrypointOptions {
  i18n?: RuntimeI18nConfig;
  languages?: LanguagesConfig;
  lang?: string;
}

function resolveHtmlLang(
  rel: string,
  config: DocConfig = {},
  languages: LanguagesConfig = {}
): string {
  const i18n = runtimeOption(config, 'i18n') as RuntimeI18nConfig | undefined;
  const fallback =
    String(i18n?.locale || languages.locale || 'zh-CN').trim() || 'zh-CN';
  if (!isI18nEnabled(config)) return fallback;

  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  if (!locales.length) return fallback;

  const firstSegment = normalizePath(rel).split('/')[0]?.toLowerCase();
  const matched = locales.find(
    (locale) => normalizePath(locale?.path).toLowerCase() === firstSegment
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
}: RenderHtmlOptions): string {
  const cssHref = relativeAsset(rel, 'styles.css');
  const runtimeHref = relativeAsset(rel, 'runtime.js');
  const searchHref = relativeAsset(rel, 'search.js');
  const themeEnabled = isThemeEnabled(config);
  const theme = runtimeOption(config, 'theme');
  const themeDefault = isRecord(theme) ? theme.default : undefined;
  const i18n = (runtimeOption(config, 'i18n') || {}) as RuntimeI18nConfig;
  const i18nRedirectScript =
    isI18nEnabled(config) &&
    i18n.redirectToDefault !== false &&
    normalizePath(rel) === 'index.html'
      ? i18nRedirectBootScript(i18n, languages)
      : '';
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
<body class="doc-layout-${pageLayout?.name || 'default'}">
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
  lang = 'en',
}: DefaultLocaleEntrypointOptions = {}): string {
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
