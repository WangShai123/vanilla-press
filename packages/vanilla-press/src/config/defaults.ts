export const DEFAULT_CONFIG_TS = `import type { RuntimeConfig } from 'vanilla-press';

export default {
  siteName: "VanillaPress",
  siteUrl: "https://example.com",
  server: {
    social: {
      github: "https://github.com/WangShai123/vanilla-press"
    },
    footerScript: "script",
    highlight: {
      light: "github-light-default",
      dark: "github-dark-default"
    },
    llms: {
      link: true,
      copy: true,
      chatgpt: true,
      claude: true
    },
    externalLink: true,
    prevNext: false,
    i18n: {
      locale: "zh-CN",
      fallbackLocale: "en",
      locales: [
        { code: "zh-CN", label: "简体中文", path: "zh" },
        { code: "en", label: "English", path: "en" }
      ],
      redirectToDefault: true
    },
    editLink: {
      text: "editor.editLink"
    },
    lastEdit: {
      text: "editor.lastUpdated",
      format: "yyyy-MM-dd HH:mm:ss",
      utc: true
    },
    client: {
      shared: []
    }
  },
  client: {
    editorSize: "sm",
    search: true,
    toc: true,
    theme: {
      enabled: true,
      default: {
        mode: "dark",
        theme: "indigo",
        radius: "sm",
        shadow: "sm",
        font: "sm"
      },
      offcanvas: {
        direction: "right"
      }
    }
  }
} satisfies RuntimeConfig;
`

export const DEFAULT_FOOTER_SCRIPT_TS = `import type { FooterScriptConfig } from 'vanilla-press';

export default \`\` satisfies FooterScriptConfig;
`

export const DEFAULT_ROBOTS_CONFIG = {
  rules: [
    {
      userAgent: '*',
      allow: ['/'],
      disallow: [],
    },
  ],
}

export const DEFAULT_ROBOTS_TS = `import type { RobotsConfig } from 'vanilla-press';

export default {
  rules: [
    {
      userAgent: "*",
      allow: ["/"],
      disallow: []
    }
  ]
} satisfies RobotsConfig;
`

export const DEFAULT_LLMS_CONFIG = {
  title: 'VanillaPress',
  description: 'Markdown source routes for LLMs.',
  sectionTitle: 'Docs',
  container: {
    labels: {
      'zh-CN': {
        link: '查看 Markdown',
        copy: '复制 Markdown 链接',
        chatgpt: '在 ChatGPT 中打开',
        claude: '在 Claude 中打开',
        options: 'LLMs',
      },
      en: {
        link: 'View Markdown',
        copy: 'Copy Markdown link',
        chatgpt: 'Open in ChatGPT',
        claude: 'Open in Claude',
        options: 'LLMs',
      },
    },
  },
}

export const DEFAULT_LLMS_TS = `import type { LlmsConfig } from 'vanilla-press';

export default {
  title: "VanillaPress",
  description: "Markdown source routes for LLMs.",
  sectionTitle: "Docs",
  container: {
    labels: {
      "zh-CN": {
        link: "查看 Markdown",
        copy: "复制 Markdown 链接",
        chatgpt: "在 ChatGPT 中打开",
        claude: "在 Claude 中打开",
        options: "LLMs"
      },
      en: {
        link: "View Markdown",
        copy: "Copy Markdown link",
        chatgpt: "Open in ChatGPT",
        claude: "Open in Claude",
        options: "LLMs"
      }
    }
  }
} satisfies LlmsConfig;
`

export const DEFAULT_MENU_TS = `import type { MenuConfig } from 'vanilla-press';

export default [
  { label: "menu.home", path: "index" },
  {
    label: "menu.guide",
    children: [
      { label: "menu.components", path: "guide/components" },
      { label: "menu.api", path: "guide/api" }
    ]
  }
] satisfies MenuConfig;
`

export const DEFAULT_LANGUAGES_TS = `import type { LanguageMessages } from 'vanilla-press';

export default {
  "zh-CN": {
    menu: {
      home: "首页",
      guide: "指南",
      components: "组件",
      api: "API"
    },
    sidebar: {
      home: "首页",
      guide: "指南",
      components: "组件",
      api: "API"
    },
    mobile: {
      navigation: "导航",
      toc: "目录"
    },
    search: {
      button: "搜索",
      title: "搜索文档",
      placeholder: "输入关键词...",
      empty: "没有找到匹配内容",
      hint: "输入关键词搜索标题和正文"
    },
    prevNext: {
      previous: "上一页",
      next: "下一页"
    },
    footer: {
      text: "Built with markdown-it and vanilla-jui."
    },
    theme: {
      button: "主题"
    },
    auth: {
      login: "登录"
    },
    editor: {
      editLink: "在 GitHub 上编辑此页面",
      lastUpdated: "最后更新于:"
    }
  },
  en: {
    menu: {
      home: "Home",
      guide: "Guide",
      components: "Components",
      api: "API"
    },
    sidebar: {
      home: "Home",
      guide: "Guide",
      components: "Components",
      api: "API"
    },
    mobile: {
      navigation: "Navigation",
      toc: "Contents"
    },
    search: {
      button: "Search",
      title: "Search Docs",
      placeholder: "Type keywords...",
      empty: "No results found",
      hint: "Search titles and page content"
    },
    prevNext: {
      previous: "Previous",
      next: "Next"
    },
    footer: {
      text: "Built with markdown-it and vanilla-jui."
    },
    theme: {
      button: "Theme"
    },
    auth: {
      login: "Login"
    },
    editor: {
      editLink: "Edit this page on GitHub",
      lastUpdated: "Last updated:"
    }
  }
} satisfies LanguageMessages;
`

export const DEFAULT_SIDEBAR_TS = `import type { SidebarConfig } from 'vanilla-press';

export default [
  { label: "sidebar.home", path: "index" },
  {
    label: "sidebar.guide",
    collapse: false,
    children: [
      { label: "sidebar.components", path: "guide/components" },
      { label: "sidebar.api", path: "guide/api" }
    ]
  }
] satisfies SidebarConfig;
`
