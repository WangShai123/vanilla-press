import type {
  RuntimeConfig,
  FooterScriptConfig,
  LanguagesConfig,
  PageLayout,
  RuntimeI18nConfig,
  SeoData,
} from '../types.ts'
import { isRecord } from '../types.ts'
import {
  isI18nEnabled,
  isSearchEnabled,
  isThemeEnabled,
  serverOption,
} from '../utilities/features.ts'
import { escapeHtml } from '../utilities/html.ts'
import { i18nRedirectBootScript } from '../utilities/i18n-routes.ts'
import { documentTitle, normalizeSiteName } from '../utilities/page.ts'
import { normalizePath, relativeAsset } from '../utilities/path.ts'
import {
  searchIndexFileName,
  searchIndexFileNameForPage,
} from '../utilities/search.ts'
import { renderHead } from './template/head.ts'
import { renderRuntimeScript } from './template/runtime.ts'

interface RenderHtmlOptions {
  title: string
  seo: SeoData
  body: string
  rel: string
  components: string[]
  config: RuntimeConfig
  languages: LanguagesConfig
  pageLayout: PageLayout
  componentScripts?: string[]
  layoutScript?: string
  searchEnabled?: boolean
  importMap?: Record<string, string>
  scripts?: string[]
  clientScripts?: string[]
  clientStyles?: string[]
  footerScript?: FooterScriptConfig
}

interface DefaultLocaleEntrypointOptions {
  i18n?: RuntimeI18nConfig
  languages?: LanguagesConfig
  lang?: string
  config?: RuntimeConfig
  footerScript?: FooterScriptConfig
}

function resolveHtmlLang(
  rel: string,
  config: RuntimeConfig = {},
  languages: LanguagesConfig = {}
): string {
  const i18n = serverOption(config, 'i18n') as RuntimeI18nConfig | undefined
  const fallback =
    String(i18n?.locale || languages.locale || 'zh-CN').trim() || 'zh-CN'
  if (!isI18nEnabled(config)) return fallback

  const locales = Array.isArray(languages.locales) ? languages.locales : []
  if (!locales.length) return fallback

  const firstSegment = normalizePath(rel).split('/')[0]?.toLowerCase()
  const matched = locales.find(
    (locale) => normalizePath(locale?.path).toLowerCase() === firstSegment
  )

  return String(matched?.code || fallback).trim() || fallback
}

function renderPageScripts(rel: string, scripts: string[] = []): string {
  return scripts
    .map(
      (script) =>
        `  <script type="module" src="${relativeAsset(rel, script)}"></script>`
    )
    .join('\n')
}

function renderImportMap(imports: Record<string, string> = {}): string {
  if (!Object.keys(imports).length) return ''

  return `  <script type="importmap">${JSON.stringify({
    imports,
  })}</script>`
}

function footerScriptType(config: RuntimeConfig = {}): 'script' | 'module' {
  return serverOption(config, 'footerScript') === 'module' ? 'module' : 'script'
}

function escapeScriptContent(value: FooterScriptConfig = ''): string {
  return String(value).replace(/<\/script/gi, '<\\/script')
}

function renderFooterScript(
  config: RuntimeConfig = {},
  footerScript: FooterScriptConfig = ''
): string {
  const code = String(footerScript || '').trim()
  if (!code) return ''

  const type = footerScriptType(config)
  const attr = type === 'module' ? ' type="module"' : ''
  return `  <script${attr}>\n${escapeScriptContent(code)}\n  </script>`
}

function delayScript(code: string, delay = 500): string {
  return code ? `setTimeout(function(){${code}},${delay});` : ''
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
  componentScripts = [],
  layoutScript = '',
  searchEnabled = isSearchEnabled(config),
  importMap = {},
  scripts = [],
  clientScripts = [],
  clientStyles = [],
  footerScript = '',
}: RenderHtmlOptions): string {
  const cssHref = relativeAsset(rel, 'public/styles.css')
  const faviconHref = relativeAsset(rel, 'public/favicon.ico')
  const runtimeHref = relativeAsset(rel, 'public/runtime.js')
  const searchHref = relativeAsset(
    rel,
    `public/${isI18nEnabled(config) ? searchIndexFileNameForPage(rel, languages) : searchIndexFileName()}`
  )
  const themeEnabled = isThemeEnabled(config)
  const theme = config.client?.theme
  const themeDefault = isRecord(theme) ? theme.default : undefined
  const i18n = (serverOption(config, 'i18n') || {}) as RuntimeI18nConfig
  const i18nRedirectScript =
    isI18nEnabled(config) &&
    i18n.redirectToDefault !== false &&
    normalizePath(rel) === 'index.html'
      ? i18nRedirectBootScript(i18n, languages)
      : ''
  const htmlLang = resolveHtmlLang(rel, config, languages)
  const htmlTitle = documentTitle(seo?.title || title, config, rel)
  const importMapHtml = renderImportMap(importMap)
  const pageScripts = renderPageScripts(rel, scripts)
  const clientScriptTags = renderPageScripts(rel, clientScripts)
  const clientStyleHrefs = clientStyles.map((style) =>
    relativeAsset(rel, style)
  )
  const footerScriptHtml = renderFooterScript(config, footerScript)

  return `<!doctype html>
<html lang="${htmlLang}">
  ${renderHead({
    title: htmlTitle,
    seo,
    themeEnabled,
    themeDefault,
    i18nRedirectScript,
    cssHref,
    stylesheets: clientStyleHrefs,
    faviconHref,
    config,
  })}
<body class="vp-layout-${pageLayout?.name || 'default'}">
  ${pageLayout?.html || body}
${importMapHtml ? `${importMapHtml}\n` : ''}
  ${renderRuntimeScript({
    runtimeHref,
    searchHref,
    searchEnabled,
    components,
    componentScripts: componentScripts.map((script) =>
      relativeAsset(rel, script)
    ),
    layoutScript: layoutScript ? relativeAsset(rel, layoutScript) : '',
    title,
    rel,
    seo,
  })}
${pageScripts ? `${pageScripts}\n` : ''}
${clientScriptTags ? `${clientScriptTags}\n` : ''}
${footerScriptHtml ? `${footerScriptHtml}\n` : ''}
</body>
</html>
`
}

export function renderDefaultLocaleEntrypoint({
  i18n = {},
  languages = {},
  lang = 'en',
  config = {},
  footerScript = '',
}: DefaultLocaleEntrypointOptions = {}): string {
  const i18nRedirectScript = i18nRedirectBootScript(i18n, languages)
  const theme = config.client?.theme
  const themeDefault = isRecord(theme) ? theme.default : undefined
  const siteName = normalizeSiteName(config)
  const footerScriptHtml = renderFooterScript(config, footerScript)

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
${renderHead({
  title: siteName,
  seo: {},
  themeEnabled: isThemeEnabled(config),
  themeDefault,
  i18nRedirectScript: delayScript(i18nRedirectScript),
  cssHref: './public/styles.css',
  faviconHref: './public/favicon.ico',
  config,
})}
<body>
  <div class="j-loader"><span class="loader" style="--loader-width:3px;--loader-size:3rem;"></span></div>
${footerScriptHtml ? `${footerScriptHtml}\n` : ''}
</body>
</html>
`
}
