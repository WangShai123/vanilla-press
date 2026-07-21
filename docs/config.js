export const docConfig = {
  siteName: "VanillaPress",
  siteUrl: "https://vanilla-press.jealer.com",
  runtime: {
    seo: true,
    highlight: true,
    menu: true,
    sidebar: true,
    toc: {
      enabled: true,
      headings: "h2, h3",
    },
    search: true,
    prevNext: true,
    sitemap: true,
    robots: true,
    llms: {
      enabled: true,
      link: true,
      copy: true,
      chatgpt: true,
      claude: true,
    },
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
  },
  components: {
    tree: {
      enabled: true,
      fileIcon: true,
    },
  },
  social: {
    github: "https://github.com/WangShai123/vanilla-press",
  },
};
