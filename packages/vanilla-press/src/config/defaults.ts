import DEFAULT_HIGHLIGHT_LANGUAGES from './highlight.ts';

const DEFAULT_HIGHLIGHT_LANGUAGES_TS = `[
${DEFAULT_HIGHLIGHT_LANGUAGES.map(
  ({ value, label }, index) =>
    `        { value: ${JSON.stringify(value)}, label: ${JSON.stringify(label)} }${index === DEFAULT_HIGHLIGHT_LANGUAGES.length - 1 ? '' : ','}`
).join('\n')}
      ]`;

export const DEFAULT_CONFIG_TS = `import type { DocConfig } from 'vanilla-press';

export default {
  siteName: "VanillaPress",
  siteUrl: "https://example.com",
  runtime: {
    seo: true,
    search: true,
    externalLink: true,
    highlight: {
      enabled: true,
      languages: ${DEFAULT_HIGHLIGHT_LANGUAGES_TS}
    },
    menu: true,
    sidebar: true,
    toc: true,
    prevNext: false,
    sitemap: false,
    robots: true,
    footerScript: "script",
    inlineScript: {
      shared: []
    },
    llms: {
      enabled: true,
      link: true,
      copy: true,
      chatgpt: true,
      claude: true
    },
    i18n: {
      enabled: true,
      locale: "zh-CN",
      fallbackLocale: "en",
      locales: [
        { code: "zh-CN", label: "简体中文", path: "zh" },
        { code: "en", label: "English", path: "en" }
      ],
      redirectToDefault: true
    },
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
  },
  social: {
    github: "https://github.com/WangShai123/vanilla-press"
  }
} satisfies DocConfig;
`;

export const DEFAULT_FOOTER_SCRIPT_TS = `import type { FooterScriptConfig } from 'vanilla-press';

export default \`\` satisfies FooterScriptConfig;
`;

export const DEFAULT_ROBOTS_CONFIG = {
  rules: [
    {
      userAgent: '*',
      allow: ['/'],
      disallow: [],
    },
  ],
};

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
`;

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
};

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
`;

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
`;

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
    }
  }
} satisfies LanguageMessages;
`;

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
`;

export const MOBILE_CLASS_BOOT_SCRIPT =
  "(function(w,n,d){function m(){var u;if(typeof n==='undefined')return!1;if(n.userAgentData&&typeof n.userAgentData.mobile==='boolean')return n.userAgentData.mobile;u=n.userAgent||'';if(/\\b(BlackBerry|webOS|iPhone|IEMobile|Android|Windows Phone|iPad|iPod)\\b/i.test(u))return!0;if(typeof w==='undefined'||typeof w.matchMedia!=='function')return!1;return w.matchMedia('(pointer: coarse)').matches&&w.matchMedia('(max-width: 820px)').matches}var r=d.documentElement,b=m();r.classList.toggle('is-mobile',b);r.classList.toggle('is-desktop',!b)})(window,navigator,document);";
