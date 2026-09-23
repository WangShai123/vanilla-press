import type { RuntimeConfig, SeoData } from '../../types.ts'
import { deviceClassBootScript } from '../../utilities/device.ts'
import { editorSizeBootScript } from '../../utilities/editor-size.ts'
import { escapeHtml } from '../../utilities/html.ts'
import { toText } from '../../utilities/string.ts'
import { themeBootScript } from '../../utilities/theme.ts'

interface HeadOptions {
  title: string
  seo: SeoData
  themeEnabled: boolean
  themeDefault: unknown
  i18nRedirectScript: string
  cssHref: string
  stylesheets?: string[]
  faviconHref: string
  config?: RuntimeConfig
}

function renderSeoMeta(seo: SeoData = {}): string {
  return ['keywords', 'description']
    .map((name) => {
      const content = toText(seo[name]).trim()
      return content
        ? `  <meta name="${name}" content="${escapeHtml(content)}" data-vp-seo="${name}">`
        : ''
    })
    .filter(Boolean)
    .join('\n')
}

export function renderHead({
  title,
  seo,
  themeEnabled,
  themeDefault,
  i18nRedirectScript,
  cssHref,
  stylesheets = [],
  faviconHref,
  config,
}: HeadOptions): string {
  const seoMeta = renderSeoMeta(seo)
  const deviceBootScript = deviceClassBootScript()
  const editorBootScript = editorSizeBootScript(config)
  const pageStylesheets = stylesheets
    .map((href) => `  <link rel="stylesheet" href="${href}">`)
    .join('\n')

  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="generator" content="vanilla-press">
  <meta name="vanilla-press-homepage" content="https://app.jealer.com/en/vanilla-press/">
  <title>${escapeHtml(title)}</title>
  ${seoMeta ? `${seoMeta}\n` : ''}
  <script>${deviceBootScript}
  ${themeEnabled ? `${themeBootScript(themeDefault)}` : ''}
  ${editorBootScript}
  ${i18nRedirectScript || ''}</script>
  <link rel="icon" href="${faviconHref}">
  <link rel="stylesheet" href="${cssHref}">
${pageStylesheets ? `${pageStylesheets}\n` : ''}
</head>`
}
