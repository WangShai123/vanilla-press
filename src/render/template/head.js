import { MOBILE_CLASS_BOOT_SCRIPT } from "../../config/defaults.js";
import { themeBootScript } from "../../utilities/theme.js";
import { escapeHtml } from "../../utilities/html.js";

function renderSeoMeta(seo = {}) {
  return ["keywords", "description"]
    .map((name) => {
      const content = String(seo[name] || "").trim();
      return content
        ? `  <meta name="${name}" content="${escapeHtml(content)}" data-doc-seo="${name}">`
        : "";
    })
    .filter(Boolean)
    .join("\n");
}

export function renderHead({
  title,
  seo,
  themeEnabled,
  themeDefault,
  i18nRedirectScript,
  cssHref,
}) {
  const seoMeta = renderSeoMeta(seo);

  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  ${seoMeta ? `${seoMeta}\n` : ""}
  <script>${MOBILE_CLASS_BOOT_SCRIPT}
  ${themeEnabled ? `${themeBootScript(themeDefault)}` : ""}
  ${i18nRedirectScript || ""}</script>
  <link rel="stylesheet" href="${cssHref}">
</head>`;
}
