import type { RuntimeConfig } from 'vanilla-press'

export default {
  siteName: 'VanillaPress',
  siteUrl: 'https://app.jealer.com/vanilla-press',
  server: {
    social: {
      github: 'https://github.com/WangShai123/vanilla-press',
    },
    footerScript: 'script',
    highlight: {
      light: 'github-light-default',
      dark: 'github-dark-default',
    },
    llms: {
      link: true,
      copy: true,
      chatgpt: true,
      claude: true,
    },
    externalLink: true,
    prevNext: true,
    i18n: {
      locale: 'zh-CN',
      fallbackLocale: 'en',
      locales: [
        { code: 'zh-CN', label: '简体中文', path: 'zh' },
        { code: 'en', label: 'English', path: 'en' },
      ],
      redirectToDefault: true,
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
    client: {
      shared: [],
    },
  },
  client: {
    editorSize: 'sm',
    toc: {
      enabled: true,
      headings: 'h2, h3',
      offset: 100,
    },
    search: true,
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
