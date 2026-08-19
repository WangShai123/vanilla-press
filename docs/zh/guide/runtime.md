# 运行时

`vanilla-press` 的运行时分为 构建阶段 和 浏览器阶段。

- 构建阶段：控制构建阶段的输出，以及构建器生成的页面片段。
- 浏览器阶段：控制浏览器中加载的运行时行为。

## 配置对象

`vanilla-press` 会根据 `vp/config/runtime.ts` 中的配置，按需构建和渲染站点的运行时功能。

配置文件 `vp/config/runtime.ts` 的默认导出对象分成三层：

- `siteName` 和 `siteUrl` 用来定义站点名称与部署地址。
- `build` 构建阶段配置。
- `browser` 浏览器阶段配置。

### 基础

| 配置项   | 类型   | 默认值         | 说明                                                                                      |
| -------- | ------ | -------------- | ----------------------------------------------------------------------------------------- |
| siteName | string | "VanillaPress" | 站点名称，未配置时会回退到 "VanillaPress"                                                 |
| siteUrl  | string | 必填           | 站点部署的绝对地址，例如 `https://example.com`；缺失或不是 `http(s)` 绝对地址时构建会报错 |

### build

| 配置项                   | 类型                 | 默认值                                                                                                     | 说明                                                                                   |
| ------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `build`                  | object               | -                                                                                                          | 构建阶段配置                                                                           |
| `build.social`           | object               | -                                                                                                          | 页脚社交链接配置对象，key 为图标名，value 为链接地址                                   |
| `build.sitemap`          | boolean \| object    | false                                                                                                      | 是否在 `dist/` 中输出 `sitemap.xml`                                                    |
| `build.robots`           | boolean              | true                                                                                                       | 是否在 `dist/` 中输出 `robots.txt`，设置为 `false` 时关闭                              |
| `build.footerScript`     | "script" \| "module" | "script"                                                                                                   | 页脚脚本标签类型；脚本内容来自 `vp/config/footerScript.ts`                             |
| `build.vpScript.shared`  | array                | []                                                                                                         | 额外打包进 `runtime.js` 的 npm 依赖，供页面 `vp-script` 模块复用                       |
| `build.llms`             | boolean \| object    | true                                                                                                       | 是否在 `dist/` 中输出 `llms.txt`、每个页面对应的 Markdown 路由和页面 Markdown 操作入口 |
| `build.llms.enabled`     | boolean              | true                                                                                                       | 是否启用 LLMs 功能，设置为 `false` 时关闭                                              |
| `build.llms.link`        | boolean              | true                                                                                                       | 是否在正文标题下输出“查看 Markdown”按钮                                                |
| `build.llms.copy`        | boolean              | true                                                                                                       | 是否在 LLMs 下拉菜单中输出复制 Markdown 链接入口                                       |
| `build.llms.chatgpt`     | boolean              | true                                                                                                       | 是否在 LLMs 下拉菜单中输出 ChatGPT 打开入口                                            |
| `build.llms.claude`      | boolean              | true                                                                                                       | 是否在 LLMs 下拉菜单中输出 Claude 打开入口                                             |
| `build.editLink`         | boolean \| object    | `{"pattern":"https://github.com/WangShai123/vanilla-press/edit/main/docs/:path","text":"editor.editLink"}` | 默认启用。`true` 会使用默认链接与默认文案。                                            |
| `build.editLink.pattern` | string               | `https://github.com/WangShai123/vanilla-press/edit/main/docs/:path`                                        | 编辑链接模板，`:path` 会替换为当前页面对应的 Markdown 源文件路径。                     |
| `build.editLink.text`    | string \| object     | `editor.editLink`                                                                                          | 编辑链接文案，默认使用 `editor.editLink` 多语言文本。                                  |
| `build.lastEdit`         | boolean \| object    | `{"text":"editor.lastUpdated","format":"yyyy-MM-dd HH:mm:ss","utc":true}`                                  | 默认启用。`true` 会使用默认文案、默认格式和时区标记。                                  |
| `build.lastEdit.text`    | string \| object     | `editor.lastUpdated`                                                                                       | 最后更新时间文案，默认使用 `editor.lastUpdated` 多语言文本。                           |
| `build.lastEdit.format`  | string               | `yyyy-MM-dd HH:mm:ss`                                                                                      | 最后更新时间格式，默认使用 `yyyy-MM-dd HH:mm:ss` 格式。                                |
| `build.lastEdit.utc`     | boolean              | true                                                                                                       | 是否在时间后追加当前构建环境的 UTC 标记，如 `UTC+8`。                                  |

### runtime

| 配置项                              | 类型              | 默认值         | 说明                                                                                                           |
| ----------------------------------- | ----------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| `browser`                           | object            | -              | 浏览器运行时配置                                                                                               |
| `browser.seo`                       | boolean           | true           | 是否启用 SEO 功能，设置为 `false` 时关闭                                                                       |
| `browser.search`                    | boolean           | true           | 是否启用搜索功能，设置为 `false` 时关闭                                                                        |
| `browser.externalLink`              | boolean           | true           | 是否增强正文、菜单、侧边栏区域的站外链接，设置为 `false` 时关闭                                                |
| `browser.highlight`                 | boolean \| object | true           | 是否启用代码高亮，设置为 `false` 时关闭                                                                        |
| `browser.highlight.enabled`         | boolean           | true           | 是否启用代码高亮，设置为 `false` 时关闭                                                                        |
| `browser.highlight.languages`       | array             | 默认语言列表   | 支持高亮的语言列表，仅会注册列表中的 `highlight.js` 语言模块                                                   |
| `browser.menu`                      | boolean           | true           | 是否启用顶部主菜单，设置为 `false` 时关闭                                                                      |
| `browser.sidebar`                   | boolean           | true           | 是否启用侧边栏，设置为 `false` 时关闭                                                                          |
| `browser.toc`                       | boolean \| object | true           | 是否启用页面目录                                                                                               |
| `browser.toc.enabled`               | boolean           | true           | 是否启用页面目录，设置为 `false` 时关闭                                                                        |
| `browser.toc.headings`              | string            | "h2, h3"       | 目录标题选择器                                                                                                 |
| `browser.toc.offset`                | number            | 80             | 滚动定位偏移量                                                                                                 |
| `browser.prevNext`                  | boolean \| object | false          | 是否启用上一页/下一页分页导航                                                                                  |
| `browser.i18n`                      | boolean \| object | 启用           | 国际化配置对象                                                                                                 |
| `browser.i18n.enabled`              | boolean           | true           | 是否启用国际化功能                                                                                             |
| `browser.i18n.locale`               | string            | "zh-CN"        | 默认语言                                                                                                       |
| `browser.i18n.fallbackLocale`       | string            | "en"           | 备用语言                                                                                                       |
| `browser.i18n.locales`              | array             | -              | 语言选项数组，每一项包含 `code`、`label` 和 `path`                                                             |
| `browser.i18n.redirectToDefault`    | boolean           | true           | 是否重定向到默认语言                                                                                           |
| `browser.theme`                     | boolean \| object | 启用           | 主题配置                                                                                                       |
| `browser.theme.enabled`             | boolean           | true           | 是否启用主题功能                                                                                               |
| `browser.theme.default`             | object            | -              | 主题启动内联脚本使用的初始主题值                                                                               |
| `browser.theme.default.mode`        | "dark" \| "light" | "dark"         | 初始深浅模式；错误值会回退到 "dark"                                                                            |
| `browser.theme.default.theme`       | enum              | "indigo"       | 初始色板：gray、olive、tomato、ruby、pink、violet、indigo、blue、teal、grass、mint、lime、yellow、orange、gold |
| `browser.theme.default.radius`      | enum              | "sm"           | 初始圆角：sm、md、lg、xl、round                                                                                |
| `browser.theme.default.shadow`      | enum              | "sm"           | 初始阴影：none、sm、md、lg                                                                                     |
| `browser.theme.default.font`        | enum              | "sm"           | 初始字号：sm、md                                                                                               |
| `browser.theme.label`               | string            | "theme.button" | 主题按钮的 i18n key                                                                                            |
| `browser.theme.options`             | object            | -              | 传给 `vanilla-jui` Theme 的配置对象                                                                            |
| `browser.theme.panel`               | object \| null    | -              | 传给 `theme.createPanel()` 的面板配置                                                                          |
| `browser.theme.offcanvas`           | object            | -              | 主题面板抽屉配置对象                                                                                           |
| `browser.theme.offcanvas.direction` | string            | "right"        | 主题面板抽屉方向                                                                                               |

## 默认配置

```ts
export default {
  siteName: 'VanillaPress',
  siteUrl: 'https://example.com',
  build: {
    social: {
      github: 'https://github.com/WangShai123/vanilla-press',
    },
    sitemap: false,
    robots: true,
    footerScript: 'script',
    vpScript: {
      shared: [],
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
      text: 'editor.lastUpdated',
      format: 'yyyy-MM-dd HH:mm:ss',
      utc: true,
    },
  },
  browser: {
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
}
```
