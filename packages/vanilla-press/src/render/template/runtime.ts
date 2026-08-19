import type { SeoData } from '../../types.ts'

interface RuntimeScriptOptions {
  runtimeHref: string
  searchHref: string
  searchEnabled: boolean
  components: string[]
  componentScripts: string[]
  layoutScript?: string
  title: string
  rel: string
  seo: SeoData
}

export function renderRuntimeScript({
  runtimeHref,
  searchHref,
  searchEnabled,
  components,
  componentScripts,
  layoutScript = '',
  title,
  rel,
  seo,
}: RuntimeScriptOptions): string {
  const searchSource = searchEnabled
    ? `() => import('${searchHref}').then((mod) => mod.searchIndex || [])`
    : '[]'

  const customComponentSources = JSON.stringify(componentScripts)
  const layoutScriptSource = JSON.stringify(layoutScript)

  return `<script type="module">
    import { initDocPage, isMobile, runtimeConfig, languages, menuItems, sidebarItems } from '${runtimeHref}';
    const customComponents = await Promise.all(${customComponentSources}.map(async (src) => {
      const mod = await import(src);
      const definition = mod.default || mod.component || mod;
      return {
        name: mod.name || definition?.name,
        dependsOn: mod.dependsOn || definition?.dependsOn || [],
        init: definition?.init
      };
    })).then((items) => items.filter((item) => item.name && typeof item.init === 'function'));
    const mobile = isMobile();
    const desktopChromeTemplate = document.querySelector('[data-vp-desktop-chrome]');
    const mobileChromeTemplate = document.querySelector('[data-vp-mobile-chrome]');
    const mobileSecondaryTemplate = document.querySelector('[data-vp-mobile-secondary-chrome]');
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
      config: runtimeConfig,
      customComponents,
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
    if (${layoutScriptSource}) {
      const layoutMod = await import(${layoutScriptSource});
      const initLayout = layoutMod.default || layoutMod.init;
      if (typeof initLayout === 'function') initLayout(document, runtimeConfig);
    }
  </script>`
}
