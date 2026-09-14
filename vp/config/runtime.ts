import type { RuntimeConfig } from 'vanilla-press'

export default {
  siteName: 'VanillaPress',
  siteUrl: 'https://app.jealer.com/vanilla-press',
  build: {
    social: {
      github: 'https://github.com/WangShai123/vanilla-press',
    },
    sitemap: true,
    robots: true,
    footerScript: 'script',
    vpScript: {
      shared: [],
    },
    highlight: {
      light: 'github-light-default',
      dark: 'github-dark-default',
    },
    llms: {
      enabled: true,
      link: true,
      copy: true,
      chatgpt: true,
      claude: true,
    },
    editLink: {
      pattern:
        'https://github.com/WangShai123/vanilla-press/edit/main/docs/:path',
      text: 'editor.editLink',
    },
    lastEdit: {
      format: 'yyyy-MM-dd HH:mm:ss',
      text: 'editor.lastUpdated',
      utc: true,
    },
    icp: '',
  },
  browser: {
    editorSize: 'sm',
    seo: true,
    externalLink: true,
    menu: true,
    sidebar: true,
    toc: {
      enabled: true,
      headings: 'h2, h3',
      offset: 100,
    },
    search: true,
    prevNext: true,
    i18n: {
      enabled: true,
      locale: 'zh-CN',
      fallbackLocale: 'en',
      locales: [
        { code: 'zh-CN', label: '简体中文', path: 'zh' },
        { code: 'en', label: 'English', path: 'en' },
      ],
      redirectToDefault: true,
    },
    theme: {
      enabled: true,
      default: {
        mode: 'light',
        theme: 'indigo',
        radius: 'sm',
        shadow: 'sm',
        font: 'sm',
      },
      offcanvas: {
        direction: 'right',
      },
    },
  },
} satisfies RuntimeConfig
