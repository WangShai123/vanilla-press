export const sidebarItems = [
  { label: "sidebar.home", path: "index" },
  { label: "sidebar.components", path: "guide/components" },
  { label: "API", path: "guide/api" },
  {
    label: "sidebar.config",
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
      { label: "sidebar.tree", path: "guide/tree" },
      { label: "sidebar.prevNext", path: "guide/prev-next" },
      { label: "sidebar.sitemap", path: "guide/sitemap" },
      { label: "theme.button", path: "guide/theme" },
    ],
  },
];
