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
  browserOption,
  buildOption,
} from '../utilities/features.ts'
import { escapeHtml } from '../utilities/html.ts'
import { i18nRedirectBootScript } from '../utilities/i18n-routes.ts'
import { documentTitle, normalizeSiteName } from '../utilities/page.ts'
import { normalizePath, relativeAsset } from '../utilities/path.ts'
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
  runtimeImportMap?: boolean
  scripts?: string[]
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
  const i18n = browserOption(config, 'i18n') as RuntimeI18nConfig | undefined
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

function renderRuntimeImportMap(rel: string, enabled: boolean): string {
  if (!enabled) return ''

  return `  <script type="importmap">${JSON.stringify({
    imports: {
      'vanilla-press/runtime': relativeAsset(rel, 'public/runtime.js'),
    },
  })}</script>`
}

function footerScriptType(config: RuntimeConfig = {}): 'script' | 'module' {
  return buildOption(config, 'footerScript') === 'module' ? 'module' : 'script'
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
  runtimeImportMap = false,
  scripts = [],
  footerScript = '',
}: RenderHtmlOptions): string {
  const cssHref = relativeAsset(rel, 'public/styles.css')
  const faviconHref = relativeAsset(rel, 'public/favicon.ico')
  const runtimeHref = relativeAsset(rel, 'public/runtime.js')
  const searchHref = relativeAsset(rel, 'public/search.js')
  const themeEnabled = isThemeEnabled(config)
  const theme = browserOption(config, 'theme')
  const themeDefault = isRecord(theme) ? theme.default : undefined
  const i18n = (browserOption(config, 'i18n') || {}) as RuntimeI18nConfig
  const i18nRedirectScript =
    isI18nEnabled(config) &&
    i18n.redirectToDefault !== false &&
    normalizePath(rel) === 'index.html'
      ? i18nRedirectBootScript(i18n, languages)
      : ''
  const htmlLang = resolveHtmlLang(rel, config, languages)
  const htmlTitle = documentTitle(seo?.title || title, config, rel)
  const importMap = renderRuntimeImportMap(rel, runtimeImportMap)
  const pageScripts = renderPageScripts(rel, scripts)
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
    faviconHref,
    config,
  })}
<body class="vp-layout-${pageLayout?.name || 'default'}">
  ${pageLayout?.html || body}
${importMap ? `${importMap}\n` : ''}
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
  const theme = browserOption(config, 'theme')
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
