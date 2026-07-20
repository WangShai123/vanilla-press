# 运行时

`vanilla-press` 会根据 `docs/config.js` 中的配置，按需构建和渲染站点的运行时功能。

## 配置对象

配置文件 `docs/config.js` 中的 `docConfig` 对象用于配置站点的运行时数据。

| 配置项                              | 类型              | 默认值         | 说明                                                                                      |
| ----------------------------------- | ----------------- | -------------- | ----------------------------------------------------------------------------------------- |
| siteName                            | string            | "VanillaPress" | 站点名称，未配置时会回退到 "VanillaPress"                                                 |
| siteUrl                             | string            | 必填           | 站点部署的绝对地址，例如 `https://example.com`；缺失或不是 `http(s)` 绝对地址时构建会报错 |
| runtime                             | object            | -              | 运行时功能配置对象                                                                        |
| `runtime.seo`                       | boolean           | true           | 是否启用 SEO 功能，设置为 `false` 时关闭                                                  |
| `runtime.search`                    | boolean           | true           | 是否启用搜索功能，设置为 `false` 时关闭                                                   |
| `runtime.highlight`                 | boolean           | true           | 是否启用代码高亮，设置为 `false` 时关闭                                                   |
| `runtime.menu`                      | boolean           | true           | 是否启用顶部主菜单，设置为 `false` 时关闭                                                 |
| `runtime.sidebar`                   | boolean           | true           | 是否启用侧边栏，设置为 `false` 时关闭                                                     |
| `runtime.toc`                       | boolean \| object | true           | 是否启用页面目录                                                                          |
| `runtime.toc.enabled`               | boolean           | true           | 是否启用页面目录，设置为 `false` 时关闭                                                   |
| `runtime.toc.headings`              | string            | "h2, h3"       | 目录标题选择器                                                                            |
| `runtime.prevNext`                  | boolean \| object | false          | 是否启用上一页/下一页分页导航                                                             |
| `runtime.sitemap`                   | boolean \| object | false          | 是否在 `dist/` 中输出 `sitemap.xml`                                                       |
| `runtime.i18n`                      | object            | 启用           | 国际化配置对象                                                                            |
| `runtime.i18n.enabled`              | boolean           | true           | 是否启用国际化功能                                                                        |
| `runtime.i18n.defaultLocale`        | string            | "zh-CN"        | 默认语言                                                                                  |
| `runtime.i18n.redirectToDefault`    | boolean           | true           | 是否重定向到默认语言                                                                      |
| `runtime.theme`                     | boolean \| object | 启用           | 主题配置                                                                                  |
| `runtime.theme.enabled`             | boolean           | true           | 是否启用主题功能                                                                          |
| `runtime.theme.label`               | string            | "theme.button" | 主题按钮的 i18n key                                                                       |
| `runtime.theme.options`             | object            | -              | 传给 `vanilla-jui` Theme 的配置对象                                                       |
| `runtime.theme.panel`               | object \| null    | -              | 传给 `theme.createPanel()` 的面板配置                                                     |
| `runtime.theme.offcanvas`           | object            | -              | 主题面板抽屉配置对象                                                                      |
| `runtime.theme.offcanvas.direction` | string            | "right"        | 主题面板抽屉方向                                                                          |
| components                          | object            | -              | Markdown 组件配置对象                                                                     |
| `components.tree`                   | boolean \| object | false          | 是否启用树状文件目录组件                                                                  |
| `components.tree.enabled`           | boolean           | false          | 对象形式下必须设置为 `true` 才会启用                                                      |
| `components.tree.fileIcon`          | boolean           | true           | 启用后按文件后缀渲染文件图标                                                              |
| social                              | object            | -              | 页脚社交链接配置对象，key 为图标名，value 为链接地址                                      |

## 默认配置

```javascript
export const docConfig = {
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
    tree: false,
  },
  social: {
    github: "https://github.com/WangShai123/vanilla-press",
  },
};
```
