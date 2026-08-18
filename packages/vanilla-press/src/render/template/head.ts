import { MOBILE_CLASS_BOOT_SCRIPT } from '../../config/defaults.ts';
import type { SeoData } from '../../types.ts';
import { escapeHtml } from '../../utilities/html.ts';
import { toText } from '../../utilities/string.ts';
import { themeBootScript } from '../../utilities/theme.ts';

interface HeadOptions {
  title: string;
  seo: SeoData;
  themeEnabled: boolean;
  themeDefault: unknown;
  i18nRedirectScript: string;
  cssHref: string;
  faviconHref: string;
}

function renderSeoMeta(seo: SeoData = {}): string {
  return ['keywords', 'description']
    .map((name) => {
      const content = toText(seo[name]).trim();
      return content
        ? `  <meta name="${name}" content="${escapeHtml(content)}" data-vp-seo="${name}">`
        : '';
    })
    .filter(Boolean)
    .join('\n');
}

export function renderHead({
  title,
  seo,
  themeEnabled,
  themeDefault,
  i18nRedirectScript,
  cssHref,
  faviconHref,
}: HeadOptions): string {
  const seoMeta = renderSeoMeta(seo);

  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="vanilla-press">
  <title>${escapeHtml(title)}</title>
  ${seoMeta ? `${seoMeta}\n` : ''}
  <script>${MOBILE_CLASS_BOOT_SCRIPT}
  ${themeEnabled ? `${themeBootScript(themeDefault)}` : ''}
  ${i18nRedirectScript || ''}</script>
  <link rel="icon" href="${faviconHref}">
  <link rel="stylesheet" href="${cssHref}">
</head>`;
}
