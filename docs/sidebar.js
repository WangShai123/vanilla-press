export const sidebarItems = [
  { label: "sidebar.home", path: "index" },
  { label: "sidebar.components", path: "guide/components" },
  { label: "sidebar.api", path: "guide/api" },
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
    ],
  },
];
