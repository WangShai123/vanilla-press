# 运行时

`vanilla-press` 会根据 `docs/config.ts` 中的配置，按需构建和渲染站点的运行时功能。

## 配置对象

配置文件 `docs/config.ts` 的默认导出对象用于配置站点的运行时数据。

| 配置项                              | 类型                 | 默认值         | 说明                                                                                                           |
| ----------------------------------- | -------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| siteName                            | string               | "VanillaPress" | 站点名称，未配置时会回退到 "VanillaPress"                                                                      |
| siteUrl                             | string               | 必填           | 站点部署的绝对地址，例如 `https://example.com`；缺失或不是 `http(s)` 绝对地址时构建会报错                      |
| runtime                             | object               | -              | 运行时功能配置对象                                                                                             |
| `runtime.seo`                       | boolean              | true           | 是否启用 SEO 功能，设置为 `false` 时关闭                                                                       |
| `runtime.search`                    | boolean              | true           | 是否启用搜索功能，设置为 `false` 时关闭                                                                        |
| `runtime.externalLink`              | boolean              | true           | 是否增强正文区域的站外链接，设置为 `false` 时关闭                                                              |
| `runtime.highlight`                 | boolean \| object    | true           | 是否启用代码高亮，设置为 `false` 时关闭                                                                        |
| `runtime.highlight.enabled`         | boolean              | true           | 是否启用代码高亮，设置为 `false` 时关闭                                                                        |
| `runtime.highlight.languages`       | array                | 默认语言列表   | 支持高亮的语言列表，仅会注册列表中的 `highlight.js` 语言模块                                                   |
| `runtime.menu`                      | boolean              | true           | 是否启用顶部主菜单，设置为 `false` 时关闭                                                                      |
| `runtime.sidebar`                   | boolean              | true           | 是否启用侧边栏，设置为 `false` 时关闭                                                                          |
| `runtime.toc`                       | boolean \| object    | true           | 是否启用页面目录                                                                                               |
| `runtime.toc.enabled`               | boolean              | true           | 是否启用页面目录，设置为 `false` 时关闭                                                                        |
| `runtime.toc.headings`              | string               | "h2, h3"       | 目录标题选择器                                                                                                 |
| `runtime.toc.offset`                | number               | 80             | 滚动定位偏移量                                                                                                 |
| `runtime.prevNext`                  | boolean \| object    | false          | 是否启用上一页/下一页分页导航                                                                                  |
| `runtime.sitemap`                   | boolean \| object    | false          | 是否在 `dist/` 中输出 `sitemap.xml`                                                                            |
| `runtime.robots`                    | boolean              | true           | 是否在 `dist/` 中输出 `robots.txt`，设置为 `false` 时关闭                                                      |
| `runtime.footerScript`              | "script" \| "module" | "script"       | 页脚脚本标签类型；脚本内容来自 `docs/footerScript.ts`                                                          |
| `runtime.inlineScript.shared`       | array                | []             | 额外打包进 `runtime.js` 的 npm 依赖，供页面 `vp-script` 模块复用                                               |
| `runtime.llms`                      | boolean \| object    | true           | 是否在 `dist/` 中输出 `llms.txt`、每个页面对应的 Markdown 路由和页面 Markdown 操作入口                         |
| `runtime.llms.enabled`              | boolean              | true           | 是否启用 LLMs 功能，设置为 `false` 时关闭                                                                      |
| `runtime.llms.link`                 | boolean              | true           | 是否在正文标题下输出“查看 Markdown”按钮                                                                        |
| `runtime.llms.copy`                 | boolean              | true           | 是否在 LLMs 下拉菜单中输出复制 Markdown 链接入口                                                               |
| `runtime.llms.chatgpt`              | boolean              | true           | 是否在 LLMs 下拉菜单中输出 ChatGPT 打开入口                                                                    |
| `runtime.llms.claude`               | boolean              | true           | 是否在 LLMs 下拉菜单中输出 Claude 打开入口                                                                     |
| `runtime.i18n`                      | object               | 启用           | 国际化配置对象                                                                                                 |
| `runtime.i18n.enabled`              | boolean              | true           | 是否启用国际化功能                                                                                             |
| `runtime.i18n.locale`               | string               | "zh-CN"        | 默认语言                                                                                                       |
| `runtime.i18n.fallbackLocale`       | string               | "en"           | 备用语言                                                                                                       |
| `runtime.i18n.locales`              | array                | -              | 语言选项数组，每一项包含 `code`、`label` 和 `path`                                                             |
| `runtime.i18n.redirectToDefault`    | boolean              | true           | 是否重定向到默认语言                                                                                           |
| `runtime.theme`                     | boolean \| object    | 启用           | 主题配置                                                                                                       |
| `runtime.theme.enabled`             | boolean              | true           | 是否启用主题功能                                                                                               |
| `runtime.theme.default`             | object               | -              | 主题启动内联脚本使用的初始主题值                                                                               |
| `runtime.theme.default.mode`        | "dark" \| "light"    | "dark"         | 初始深浅模式；错误值会回退到 "dark"                                                                            |
| `runtime.theme.default.theme`       | enum                 | "indigo"       | 初始色板：gray、olive、tomato、ruby、pink、violet、indigo、blue、teal、grass、mint、lime、yellow、orange、gold |
| `runtime.theme.default.radius`      | enum                 | "sm"           | 初始圆角：sm、md、lg、xl、round                                                                                |
| `runtime.theme.default.shadow`      | enum                 | "sm"           | 初始阴影：none、sm、md、lg                                                                                     |
| `runtime.theme.default.font`        | enum                 | "sm"           | 初始字号：sm、md                                                                                               |
| `runtime.theme.label`               | string               | "theme.button" | 主题按钮的 i18n key                                                                                            |
| `runtime.theme.options`             | object               | -              | 传给 `vanilla-jui` Theme 的配置对象                                                                            |
| `runtime.theme.panel`               | object \| null       | -              | 传给 `theme.createPanel()` 的面板配置                                                                          |
| `runtime.theme.offcanvas`           | object               | -              | 主题面板抽屉配置对象                                                                                           |
| `runtime.theme.offcanvas.direction` | string               | "right"        | 主题面板抽屉方向                                                                                               |
| social                              | object               | -              | 页脚社交链接配置对象，key 为图标名，value 为链接地址                                                           |

## 默认配置

```javascript
export default {
  siteName: 'VanillaPress',
  siteUrl: 'https://example.com',
  runtime: {
    seo: true,
    search: true,
    externalLink: true,
    highlight: {
      enabled: true,
      languages: [
        { value: 'plaintext', label: 'Plain Text' },
        { value: 'bash', label: 'Bash' },
        { value: 'c', label: 'C' },
        { value: 'cpp', label: 'C++' },
        { value: 'css', label: 'CSS' },
        { value: 'dockerfile', label: 'Dockerfile' },
        { value: 'go', label: 'Go' },
        { value: 'graphql', label: 'GraphQL' },
        { value: 'html', label: 'HTML' },
        { value: 'java', label: 'Java' },
        { value: 'javascript', label: 'JavaScript' },
        { value: 'json', label: 'JSON' },
        { value: 'kotlin', label: 'Kotlin' },
        { value: 'markdown', label: 'Markdown' },
        { value: 'nginx', label: 'Nginx' },
        { value: 'php', label: 'PHP' },
        { value: 'python', label: 'Python' },
        { value: 'ruby', label: 'Ruby' },
        { value: 'rust', label: 'Rust' },
        { value: 'sql', label: 'SQL' },
        { value: 'swift', label: 'Swift' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'xml', label: 'XML' },
        { value: 'yaml', label: 'YAML' },
      ],
    },
    menu: true,
    sidebar: true,
    toc: true,
    prevNext: false,
    sitemap: false,
    robots: true,
    footerScript: 'script',
    llms: {
      enabled: true,
      link: true,
      copy: true,
      chatgpt: true,
      claude: true,
    },
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
  social: {
    github: 'https://github.com/WangShai123/vanilla-press',
  },
};
```
