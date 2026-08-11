import type {
  DocConfig,
  FooterScriptConfig,
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
  runtimeImportMap?: boolean;
  scripts?: string[];
  footerScript?: FooterScriptConfig;
}

interface DefaultLocaleEntrypointOptions {
  i18n?: RuntimeI18nConfig;
  languages?: LanguagesConfig;
  lang?: string;
  config?: DocConfig;
  footerScript?: FooterScriptConfig;
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

function renderPageScripts(rel: string, scripts: string[] = []): string {
  return scripts
    .map(
      (script) =>
        `  <script type="module" src="${relativeAsset(rel, script)}"></script>`
    )
    .join('\n');
}

function renderRuntimeImportMap(rel: string, enabled: boolean): string {
  if (!enabled) return '';

  return `  <script type="importmap">${JSON.stringify({
    imports: {
      'vanilla-press/runtime': relativeAsset(rel, 'runtime.js'),
    },
  })}</script>`;
}

function footerScriptType(config: DocConfig = {}): 'script' | 'module' {
  return runtimeOption(config, 'footerScript') === 'module'
    ? 'module'
    : 'script';
}

function escapeScriptContent(value: FooterScriptConfig = ''): string {
  return String(value).replace(/<\/script/gi, '<\\/script');
}

function renderFooterScript(
  config: DocConfig = {},
  footerScript: FooterScriptConfig = ''
): string {
  const code = String(footerScript || '').trim();
  if (!code) return '';

  const type = footerScriptType(config);
  const attr = type === 'module' ? ' type="module"' : '';
  return `  <script${attr}>\n${escapeScriptContent(code)}\n  </script>`;
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
  runtimeImportMap = false,
  scripts = [],
  footerScript = '',
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
  const importMap = renderRuntimeImportMap(rel, runtimeImportMap);
  const pageScripts = renderPageScripts(rel, scripts);
  const footerScriptHtml = renderFooterScript(config, footerScript);

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
${importMap ? `${importMap}\n` : ''}
  ${renderRuntimeScript({
    runtimeHref,
    searchHref,
    searchEnabled,
    components,
    title,
    rel,
    seo,
  })}
${pageScripts ? `${pageScripts}\n` : ''}
${footerScriptHtml ? `${footerScriptHtml}\n` : ''}
</body>
</html>
`;
}

export function renderDefaultLocaleEntrypoint({
  i18n = {},
  languages = {},
  lang = 'en',
  config = {},
  footerScript = '',
}: DefaultLocaleEntrypointOptions = {}): string {
  const i18nRedirectScript = i18nRedirectBootScript(i18n, languages);
  const footerScriptHtml = renderFooterScript(config, footerScript);

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
${footerScriptHtml ? `${footerScriptHtml}\n` : ''}
</body>
</html>
`;
}
