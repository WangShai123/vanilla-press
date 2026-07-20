function renderMenuImport(menuEnabled, menuHref) {
  return menuEnabled ? `import { menuItems } from '${menuHref}';` : "const menuItems = [];";
}

function renderSidebarImport(sidebarEnabled, sidebarHref) {
  return sidebarEnabled
    ? `import { sidebarItems } from '${sidebarHref}';`
    : "const sidebarItems = [];";
}

function renderSearchImport(searchEnabled, searchHref) {
  return searchEnabled
    ? `import { searchIndex } from '${searchHref}';`
    : "const searchIndex = [];";
}

function renderLanguagesImport(i18nEnabled, languagesHref) {
  return i18nEnabled
    ? `const languages = ((await import('${languagesHref}')).languages || {});`
    : "const languages = {};";
}

export function renderRuntimeScript({
  runtimeHref,
  configHref,
  languagesHref,
  menuHref,
  sidebarHref,
  searchHref,
  menuEnabled,
  sidebarEnabled,
  searchEnabled,
  i18nEnabled,
  components,
  title,
  rel,
  seo,
}) {
  const menuImport = renderMenuImport(menuEnabled, menuHref);
  const sidebarImport = renderSidebarImport(sidebarEnabled, sidebarHref);
  const searchImport = renderSearchImport(searchEnabled, searchHref);
  const languagesImport = renderLanguagesImport(i18nEnabled, languagesHref);

  return `<script type="module">
    import { initDocPage, isMobile } from '${runtimeHref}';
    import { docConfig } from '${configHref}';
    ${menuImport}
    ${sidebarImport}
    ${searchImport}
    ${languagesImport}
    const mobile = isMobile();
    const desktopChromeTemplate = document.querySelector('[data-doc-desktop-chrome]');
    const mobileChromeTemplate = document.querySelector('[data-doc-mobile-chrome]');
    const mobileSecondaryTemplate = document.querySelector('[data-doc-mobile-secondary-chrome]');
    if (mobile && mobileChromeTemplate) {
      mobileChromeTemplate.replaceWith(mobileChromeTemplate.content.cloneNode(true));
      desktopChromeTemplate?.remove();
    } else if (!mobile && desktopChromeTemplate) {
      desktopChromeTemplate.replaceWith(desktopChromeTemplate.content.cloneNode(true));
      mobileChromeTemplate?.remove();
    } else {
      desktopChromeTemplate?.remove();
      mobileChromeTemplate?.remove();
    }
    if (mobileSecondaryTemplate) {
      if (mobile) {
        mobileSecondaryTemplate.replaceWith(mobileSecondaryTemplate.content.cloneNode(true));
      } else {
        mobileSecondaryTemplate.remove();
      }
    }
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
  </script>`;
}
