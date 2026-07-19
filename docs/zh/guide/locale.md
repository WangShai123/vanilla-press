# 国际化

让文档站点支持多语言功能，方便不同语言的用户访问。

## 运行时

在 `docs/config.js` 中，按需配置是否启用国际化功能。

```javascript
export const docConfig = {
  runtime: {
    i18n: {
      enabled: true,
      defaultLocale: "zh-CN", // 默认语言
      redirectToDefault: true, // 是否重定向到默认语言
    },
  },
};
```

## 配置

在 `docs/languages.js` 中，按需配置站点的国际化语言。

- `locale`: 默认语言
- `fallbackLocale`: 备用语言
- `locales`: 语言选项数组
  - `code`: 语言别名
  - `label`: 语言名称
  - `path`: 语言路由目录
- `messages`: 国际化语言包对象，包含不同语言的翻译内容

```javascript
export const languages = {
  locale: "zh-CN",
  fallbackLocale: "en",
  locales: [
    { code: "zh-CN", label: "简体中文", path: "zh" },
    { code: "en", label: "English", path: "en" },
  ],
  messages: {
    "zh-CN": {
      menu: {
        home: "首页",
        guide: "指南",
        components: "组件",
      },
      sidebar: {
        home: "首页",
        components: "组件",
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
      theme: {
        button: "主题",
      },
    },
    en: {
      menu: {
        home: "Home",
        guide: "Guide",
        components: "Components",
      },
      sidebar: {
        home: "Home",
        components: "Components",
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
      theme: {
        button: "Theme",
      },
    },
  },
};
```
