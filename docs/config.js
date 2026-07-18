export const docConfig = {
  siteName: "VanillaPress",
  // siteUrl: "https://vanilla-press.jealer.com",
  siteUrl: "http://localhost:5500/dist/",
  seo: true,
  highlight: true,
  menu: true,
  sidebar: true,
  toc: {
    enabled: true,
    headings: "h2, h3",
  },
  tree: {
    enabled: true,
    fileIcon: true,
  },
  search: true,
  prevNext: true,
  sitemap: true,
  i18n: {
    enabled: true,
    defaultLocale: "zh-CN",
    redirectToDefault: true,
  },
  theme: {
    enabled: true,
    offcanvas: {
      direction: "right",
    },
  },
  footer: {
    text: "footer.text",
  },
};
