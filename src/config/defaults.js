export const DEFAULT_CONFIG_JS = `export const docConfig = {
  siteName: "VanillaPress",
  siteUrl: "https://example.com",
  runtime: {
    seo: true,
    search: true,
    highlight: true,
    menu: true,
    sidebar: true,
    toc: true,
    prevNext: false,
    sitemap: false,
    i18n: {
      enabled: true,
      defaultLocale: "zh-CN",
      redirectToDefault: true
    },
    theme: {
      enabled: true,
      offcanvas: {
        direction: "right"
      }
    }
  },
  components: {
    tree: false
  },
  social: {
    github: "https://github.com/WangShai123/vanilla-press"
  }
};
`;

export const DEFAULT_MENU_JS = `export const menuItems = [
  { label: "menu.home", path: "index" },
  {
    label: "menu.guide",
    children: [
      { label: "menu.components", path: "guide/components" },
      { label: "menu.api", path: "guide/api" }
    ]
  }
];
`;

export const DEFAULT_LANGUAGES_JS = `export const languages = {
  locale: "zh-CN",
  fallbackLocale: "en",
  locales: [
    { code: "zh-CN", label: "简体中文", path: "zh" },
    { code: "en", label: "English", path: "en" }
  ],
  messages: {
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
      }
    }
  }
};
`;

export const DEFAULT_SIDEBAR_JS = `export const sidebarItems = [
  { label: "sidebar.home", path: "index" },
  {
    label: "sidebar.guide",
    collapse: false,
    children: [
      { label: "sidebar.components", path: "guide/components" },
      { label: "sidebar.api", path: "guide/api" }
    ]
  }
];
`;

export const THEME_BOOT_SCRIPT =
  "(function(d,k){var v={mode:'light',theme:'indigo',radius:'sm',shadow:'sm',font:'sm'},m=d.cookie.match(new RegExp('(?:^|; )'+k+'=([^;]*)')),o=v;if(m){try{o=Object.assign({},v,JSON.parse(m[1]));}catch(e){o=v;}}else{d.cookie=k+'='+JSON.stringify(v)+'; expires='+new Date(Date.now()+864e5).toUTCString()+'; path=/; sameSite=strict';}try{var r=o.mode==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):o.mode,h=d.documentElement;h.classList.add(r||'dark','j-theme-'+(o.theme||v.theme),'j-radius-'+(o.radius||v.radius),'j-shadow-'+(o.shadow||v.shadow),'j-font-'+(o.font||v.font));}catch(e){}})(document,'jui-theme');";

export const MOBILE_CLASS_BOOT_SCRIPT =
  "(function(w,n){function m(){if(n.userAgentData&&typeof n.userAgentData.mobile==='boolean')return n.userAgentData.mobile;var u=n.userAgent||n.vendor||w.opera||'',p=/Android|iPhone|iPad|iPod|Mobile|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(u),t=/iPad|Android(?!.*Mobile)|Tablet/i.test(u),h='maxTouchPoints'in n?n.maxTouchPoints>0:'ontouchstart'in w,s=Math.min(w.screen.width,w.screen.height)<=768;if(p&&!t){if(/iPhone|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(u))return true;if(/Android/i.test(u))return s||h}return /Macintosh|MacIntel/i.test(u)&&h&&s}var r=w.document.documentElement,b=m();r.classList.toggle('is-mobile',b);r.classList.toggle('is-desktop',!b)})(window,navigator);";
