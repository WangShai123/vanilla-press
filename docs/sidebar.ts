import type { SidebarConfig } from "../src/types.ts";

export default [
  { label: "sidebar.quickStart", path: "guide/quick-start" },
  {
    label: "sidebar.layout",
    children: [
      { label: "API", path: "guide/layout-api" },
      { label: "sidebar.home", path: "guide/layout-home" },
    ],
  },
  {
    label: "sidebar.components",
    children: [
      { label: "sidebar.components", path: "guide/components" },
      { label: "API", path: "guide/api" },
    ],
  },
  {
    label: "sidebar.runtime",
    collapse: true,
    children: [
      { label: "sidebar.runtime", path: "guide/runtime" },
      { label: "sidebar.highlight", path: "guide/highlight" },
      { label: "sidebar.locale", path: "guide/locale" },
      { label: "sidebar.menu", path: "guide/menu" },
      { label: "sidebar.sidebar", path: "guide/sidebar" },
      { label: "sidebar.toc", path: "guide/toc" },
      { label: "SEO", path: "guide/seo" },
      { label: "search.button", path: "guide/search" },
      { label: "sidebar.prevNext", path: "guide/prev-next" },
      { label: "sidebar.sitemap", path: "guide/sitemap" },
      { label: "sidebar.robots", path: "guide/robots" },
      { label: "sidebar.llms", path: "guide/llms" },
      { label: "theme.button", path: "guide/theme" },
      { label: "sidebar.externalLink", path: "guide/external-link" },
      { label: "sidebar.inlineScript", path: "guide/inline-script" },
      { label: "sidebar.footerScript", path: "guide/footer-script" },
    ],
  },
  {
    label: "sidebar.others",
    children: [{ label: "sidebar.changelog", path: "guide/changelog" }],
  },
] satisfies SidebarConfig;
