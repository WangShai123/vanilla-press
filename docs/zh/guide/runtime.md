# 运行时配置

`vp/config/runtime.ts` 用来描述站点数据、构建阶段数据和浏览器运行时数据。

```ts
import type { RuntimeConfig } from 'vanilla-press'

export default {
  siteName: 'VanillaPress',
  siteUrl: 'https://example.com',
  server: {
    social: {
      github: 'https://github.com/WangShai123/vanilla-press',
    },
    footerScript: 'script',
    highlight: {
      light: 'github-light-default',
      dark: 'github-dark-default',
    },
    externalLink: true,
    prevNext: false,
    i18n: {
      locale: 'zh-CN',
      fallbackLocale: 'en',
      locales: [
        { code: 'zh-CN', label: '中文', path: 'zh' },
        { code: 'en', label: 'EN', path: 'en' },
      ],
      redirectToDefault: true,
    },
    client: {
      shared: [],
    },
    editLink: {
      text: 'editor.editLink',
    },
    lastEdit: {
      text: 'editor.lastUpdated',
      format: 'yyyy-MM-dd HH:mm:ss',
      utc: true,
    },
  },
  client: {
    editorSize: 'sm',
    search: true,
    toc: {
      headings: 'h2, h3',
      offset: 80,
    },
    theme: {
      default: {
        mode: 'dark',
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
```

## 顶层配置

| 配置项   | 类型   | 说明                                    |
| -------- | ------ | --------------------------------------- |
| siteName | string | 站点名称                                |
| siteUrl  | string | 站点部署地址，必须是 `http(s)` 绝对地址 |
| server   | object | 构建阶段配置                            |
| client   | object | 浏览器运行时配置                        |

## server

`server` 只保存构建阶段需要用户自定义的数据。构建期功能尽量按约定执行，不再把开关型配置作为主要设计。

| 配置项                 | 类型                 | 说明                                             |
| ---------------------- | -------------------- | ------------------------------------------------ |
| server.social          | object               | 页脚社交链接配置，key 为图标名，value 为链接地址 |
| server.footerScript    | "script" \| "module" | `vp/config/footerScript.ts` 输出的脚本类型       |
| server.highlight.light | string               | 浅色模式 Shiki 主题，默认 `github-light-default` |
| server.highlight.dark  | string               | 深色模式 Shiki 主题，默认 `github-dark-default`  |
| server.externalLink    | boolean              | 构建期外链增强，默认启用                         |
| server.prevNext        | boolean \| object    | 构建期上一页/下一页导航                          |
| server.i18n            | object               | 构建期国际化元数据                               |
| server.client.entries  | object               | 自定义 client entry 脚本或样式入口               |
| server.client.shared   | array \| object      | 供布局脚本和 client entry 复用的 npm 共享依赖    |
| server.llms            | object               | LLMs 输出与页面 Markdown 操作入口配置            |
| server.editLink        | object               | 编辑链接数据配置                                 |
| server.lastEdit        | object               | 最后更新时间数据配置                             |
| icp                    | string               | ICP 备案号，未配置时不渲染                       |

## client

`client` 只描述浏览器运行时需要的数据。

| 配置项            | 类型              | 说明               |
| ----------------- | ----------------- | ------------------ |
| client.editorSize | boolean \| string | 正文编辑器尺寸控制 |
| client.search     | boolean           | 搜索功能           |
| client.toc        | boolean \| object | 页面目录           |
| client.theme      | object            | 主题配置           |

## 约定

- `vp/config/menu.ts` 导出有效菜单数组时渲染菜单。
- `vp/config/sidebar.ts` 或目录级 `sidebar.ts` 导出有效侧边栏数组时渲染侧边栏。
- 有 `vp/config/footerScript.ts` 内容时输出页脚脚本。
- 有 `server.highlight` 时使用自定义 Shiki 主题，否则使用默认主题。
- SEO 和国际化翻译在构建阶段始终启用。
- 有页面使用布局脚本或 client entry 时，按页面需要输出对应脚本和样式。
