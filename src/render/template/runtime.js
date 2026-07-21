export function renderRuntimeScript({
  runtimeHref,
  searchHref,
  searchEnabled,
  components,
  title,
  rel,
  seo,
}) {
  const searchSource = searchEnabled
    ? `() => import('${searchHref}').then((mod) => mod.searchIndex || [])`
    : "[]";

  return `<script type="module">
    import { initDocPage, isMobile, docConfig, languages, menuItems, sidebarItems } from '${runtimeHref}';
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
      search: ${searchSource},
      sidebar: sidebarItems,
      page: {
        title: ${JSON.stringify(title)},
        rel: ${JSON.stringify(rel)},
        seo: ${JSON.stringify(seo)}
      }
    });
  </script>`;
}
