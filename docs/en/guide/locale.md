# Internationalization

Enable multilingual documentation so users can browse the site in different languages.

## Runtime

In `docs/config.js`, configure whether internationalization is enabled.

```javascript
export const docConfig = {
  runtime: {
    i18n: {
      enabled: true,
      defaultLocale: "zh-CN", // Default language
      redirectToDefault: true, // Whether to redirect to the default locale
    },
  },
};
```

## Configuration

In `docs/languages.js`, configure the site's i18n languages as needed.

- `locale`: default language
- `fallbackLocale`: fallback language
- `locales`: array of language options
  - `code`: locale code
  - `label`: language name
  - `path`: locale route directory
- `messages`: locale message object containing translated UI strings for each language

```javascript
export const languages = {
  locale: "zh-CN",
  fallbackLocale: "en",
  locales: [
    { code: "zh-CN", label: "Simplified Chinese", path: "zh" },
    { code: "en", label: "English", path: "en" },
  ],
  messages: {
    "zh-CN": {
      menu: {
        home: "首页",
        guide: "指南",
        components: "组件",
        api: "API",
      },
      sidebar: {
        home: "首页",
        components: "组件",
        api: "API",
        runtime: "运行时",
        locale: "国际化",
      },
      mobile: {
        navigation: "导航",
        toc: "目录",
      },
      search: {
        button: "搜索",
        title: "搜索文档",
        placeholder: "输入关键词...",
        empty: "没有找到匹配内容",
        hint: "输入关键词搜索标题和正文",
      },
      footer: {
        text: "Built with markdown-it and vanilla-jui.",
      },
      theme: {
        button: "主题",
      },
    },
    en: {
      menu: {
        home: "Home",
        guide: "Guide",
        components: "Components",
        api: "API",
      },
      sidebar: {
        home: "Home",
        components: "Components",
        api: "API",
        runtime: "Runtime",
        locale: "Locale",
      },
      mobile: {
        navigation: "Navigation",
        toc: "Contents",
      },
      search: {
        button: "Search",
        title: "Search Docs",
        placeholder: "Type keywords...",
        empty: "No results found",
        hint: "Search titles and page content",
      },
      footer: {
        text: "Built with markdown-it and vanilla-jui.",
      },
      theme: {
        button: "Theme",
      },
    },
  },
};
```
