# LLMs

生成 `llms.txt`，并为每个页面生成对应的 Markdown 路由文件，方便 LLM 直接读取文档源内容。

## 运行时

`runtime.llms` 默认启用。只有设置为 `false` 或对象形式的 `enabled: false` 时，构建过程才会跳过 `docs/llms.js`，并且不会输出 `dist/llms.txt` 和页面对应的 `.md` 文件。

```javascript
export const docConfig = {
  runtime: {
    llms: {
      enabled: true,
      link: true,
      copy: true,
      chatgpt: true,
      claude: true,
    },
  },
};
```

`link`、`copy`、`chatgpt`、`claude` 都默认启用。只要其中任意一项启用，页面正文的 `h1` 下方就会输出 `.llms-container`。

## 配置

在 `docs/llms.js` 中配置 `llms.txt` 的标题、说明、次标题、工具栏文本。

```javascript
export const llms = {
  title: "VanillaPress",
  description: "Markdown source routes for VanillaPress documentation.",
  sectionTitle: "Docs",
  container: {
    labels: {
      "zh-CN": {
        link: "查看 Markdown",
        copy: "复制 Markdown 链接",
        chatgpt: "在 ChatGPT 中打开",
        claude: "在 Claude 中打开",
        options: "LLMs",
      },
      en: {
        link: "View Markdown",
        copy: "Copy Markdown link",
        chatgpt: "Open in ChatGPT",
        claude: "Open in Claude",
        options: "LLMs",
      },
    },
  },
};
```

## 输出

LLMS URL: `https://example.com/llms.txt`

构建时会为每个 HTML 页面输出同路径的 Markdown 文件：

| HTML 文件                        | Markdown 文件                  |
| -------------------------------- | ------------------------------ |
| `dist/zh/guide/quick-start.html` | `dist/zh/guide/quick-start.md` |
| `dist/en/guide/runtime.html`     | `dist/en/guide/runtime.md`     |

`llms.txt` 会按 `siteUrl` 生成这些 Markdown 路由的绝对地址：

```text
# VanillaPress

Markdown source routes for VanillaPress documentation.

## Docs
- https://example.com/zh/guide/quick-start.md
- https://example.com/en/guide/runtime.md
```

## 多语言

`container.labels` 用于配置页面标题下方 `.llms-container` 的多语言文案。key 需要对应 `docs/languages.js` 中的 locale code，例如 `zh-CN`、`en`。

| 字段    | 说明                       |
| ------- | -------------------------- |
| link    | 查看 Markdown 按钮文本     |
| copy    | 复制 Markdown 链接菜单文本 |
| chatgpt | ChatGPT 打开菜单文本       |
| claude  | Claude 打开菜单文本        |
| options | 下拉按钮的无障碍标签       |

## 工具栏

启用 `link` 时，页面标题下方会显示 LLMS 工具栏。包含 2 类操作：

“查看 Markdown” 按钮，点击后在新标签页打开当前页面对应的 `.md` 地址。

启用 `copy`、`chatgpt` 或 `claude` 时，会显示 LLMs 下拉按钮。下拉菜单包含已启用的操作：

- 复制 Markdown 链接
- 在 ChatGPT 中打开
- 在 Claude 中打开

## Robots

`docs/robots.js` 可以通过 `llms: true` 在 `robots.txt` 中输出 `llms.txt` 地址。
