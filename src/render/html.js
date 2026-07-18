import { THEME_BOOT_SCRIPT } from "../config/defaults.js";
import {
  isI18nEnabled,
  isMenuEnabled,
  isSearchEnabled,
  isSidebarEnabled,
  isThemeEnabled,
  isTocEnabled,
} from "../utilities/features.js";
import { escapeHtml } from "../utilities/html.js";
import { documentTitle } from "../utilities/page.js";
import { normalizePath, relativeAsset } from "../utilities/path.js";

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

function resolveHtmlLang(rel, config = {}, languages = {}) {
  const fallback =
    String(config.i18n?.defaultLocale || languages.locale || "zh-CN").trim() || "zh-CN";
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
  searchEnabled = isSearchEnabled(config),
}) {
  const cssHref = relativeAsset(rel, "styles.css");
  const runtimeHref = relativeAsset(rel, "runtime.js");
  const configHref = relativeAsset(rel, "config.js");
  const languagesHref = relativeAsset(rel, "languages.js");
  const menuHref = relativeAsset(rel, "menu.js");
  const sidebarHref = relativeAsset(rel, "sidebar.js");
  const searchHref = relativeAsset(rel, "search-index.js");
  const themeEnabled = isThemeEnabled(config);
  const i18nEnabled = isI18nEnabled(config);
  const menuEnabled = isMenuEnabled(config);
  const sidebarEnabled = isSidebarEnabled(config);
  const tocEnabled = isTocEnabled(config);
  const htmlLang = resolveHtmlLang(rel, config, languages);
  const htmlTitle = documentTitle(seo?.title || title, config);
  const seoMeta = renderSeoMeta(seo);
  const headerMenu = menuEnabled
    ? '      <nav class="doc-menu" data-doc-menu aria-label="主菜单"></nav>'
    : "";
  const desktopSearch = searchEnabled
    ? '        <button class="doc-search-button j-button is-ghost is-icon" type="button" data-doc-search hidden aria-label="搜索"></button>'
    : "";
  const desktopLocale = i18nEnabled
    ? '        <select class="doc-locale j-select" data-doc-locale aria-label="切换语言" id="doc-locale-desktop"></select>'
    : "";
  const mobileMenu = menuEnabled
    ? '        <button class="doc-mobile-icon-button j-button is-ghost is-icon" type="button" data-doc-mobile-menu aria-label="打开主菜单"></button>'
    : "";
  const mobileSearch = searchEnabled
    ? '        <button class="doc-search-button doc-mobile-icon-button j-button is-ghost is-icon" type="button" data-doc-search hidden aria-label="搜索"></button>'
    : "";
  const mobileLocale = i18nEnabled
    ? '        <select class="doc-locale j-select is-sm" data-doc-locale aria-label="切换语言" id="doc-locale-mobile"></select>'
    : "";
  const mobileSecondary =
    sidebarEnabled || tocEnabled
      ? `    <div class="doc-mobile-secondary" data-doc-mobile-secondary hidden>
      ${sidebarEnabled ? '<button class="doc-mobile-secondary-button j-button is-ghost" type="button" data-doc-mobile-sidebar aria-label="打开文档导航"></button>' : ""}
      ${tocEnabled ? '<button class="doc-mobile-secondary-button j-button is-ghost" type="button" data-doc-mobile-toc aria-label="打开页面目录"></button>' : ""}
    </div>`
      : "";
  const sidebar = sidebarEnabled
    ? `    <aside class="doc-sidebar">
      <nav class="doc-nav" data-doc-sidebar aria-label="文档导航"></nav>
    </aside>`
    : "";
  const toc = tocEnabled
    ? '        <div class="doc-toc" data-doc-toc aria-label="页面目录"></div>'
    : "";
  const hasAside = Boolean(toc || config.aside?.html);
  const aside = hasAside
    ? `      <aside class="doc-aside">
${toc}
        <div class="doc-aside-custom" data-doc-aside-custom></div>
      </aside>`
    : "";
  const menuImport = menuEnabled
    ? `import { menuItems } from '${menuHref}';`
    : "const menuItems = [];";
  const sidebarImport = sidebarEnabled
    ? `import { sidebarItems } from '${sidebarHref}';`
    : "const sidebarItems = [];";
  const searchImport = searchEnabled
    ? `import { searchIndex } from '${searchHref}';`
    : "const searchIndex = [];";
  const languagesImport = i18nEnabled
    ? `const languages = ((await import('${languagesHref}')).languages || {});`
    : "const languages = {};";

  return `<!doctype html>
<html lang="${htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(htmlTitle)}</title>
${seoMeta ? `${seoMeta}\n` : ""}  ${themeEnabled ? `<script>${THEME_BOOT_SCRIPT}</script>` : ""}
  <link rel="stylesheet" href="${cssHref}">
</head>
<body>
  <header class="doc-header">
    <div class="doc-header-inner" data-doc-desktop-header>
      <a class="doc-brand" data-doc-brand href="${relativeAsset(rel, "index.html")}">Docs</a>
${headerMenu}
      <div class="doc-header-actions">
${desktopSearch}
${desktopLocale}
        ${themeEnabled ? '<button class="doc-theme-button j-button is-outline" type="button" data-doc-theme hidden></button>' : ""}
      </div>
    </div>
    <div class="doc-mobile-header" data-doc-mobile-header hidden>
      <div class="doc-mobile-header-main">
${mobileMenu}
        <a class="doc-brand" data-doc-brand href="${relativeAsset(rel, "index.html")}">Docs</a>
      </div>
      <div class="doc-mobile-header-actions">
${mobileSearch}
${mobileLocale}
        ${themeEnabled ? '<button class="doc-theme-button doc-mobile-icon-button j-button is-ghost is-icon" type="button" data-doc-theme hidden aria-label="主题"></button>' : ""}
      </div>
    </div>
${mobileSecondary}
  </header>
  <main class="doc-shell${sidebarEnabled ? " has-sidebar" : ""}">
${sidebar}
    <section class="doc-main${hasAside ? " has-aside" : ""}">
      <div>
        <article class="j-content is-sm">
          ${body}
        </article>
      </div>
${aside}
    </section>
  </main>
  <footer class="doc-footer" data-doc-footer></footer>
  <script type="module">
    import { initDocPage } from '${runtimeHref}';
    import { docConfig } from '${configHref}';
    ${menuImport}
    ${sidebarImport}
    ${searchImport}
    ${languagesImport}
    initDocPage({
      components: ${JSON.stringify(components)},
      config: docConfig,
      languages,
      menu: menuItems,
      search: searchIndex,
      sidebar: sidebarItems,
      page: {
        title: ${JSON.stringify(title)},
        rel: ${JSON.stringify(rel)},
        seo: ${JSON.stringify(seo)}
      }
    });
  </script>
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
