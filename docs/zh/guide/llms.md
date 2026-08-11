# LLMs

生成 `llms.txt`，并为每个页面生成对应的 Markdown 路由文件，方便 LLM 直接读取文档源内容。

## 运行时

`runtime.llms` 默认启用。

```javascript
export default {
  runtime: {
    llms: true,
  },
};
```

## 元数据

`runtime.llms: true` 等同于使用默认配置。

```javascript
export default {
  runtime: {
    llms: {
      enabled: true, // 是否启用 llms 功能
      link: true, // 是否启用工具栏：查看 Markdown 链接
      copy: true, // 是否启用工具栏：复制 Markdown 链接
      chatgpt: true, // 是否启用工具栏：在 ChatGPT 中打开
      claude: true, // 是否启用工具栏：在 Claude 中打开
    },
  },
};
```

- 当设置为 `false` 时，不会构建 `dist/llms.txt` 和各个页面对应的 `.md` 文件。
- `link`、`copy`、`chatgpt`、`claude` 其中任意一项启用时，页面正文标题的下方就会输出 LLMS 工具栏。

## 配置

在 `docs/llms.ts` 中配置 `llms.txt` 中 标题、说明、次标题、工具栏 的提示文本。

```javascript
export default {
  title: 'VanillaPress',
  description: 'Markdown source routes for VanillaPress documentation.',
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
```

## 输出

根据 `siteUrl` 配置的地址，生成对应的 URL 地址和 Markdown 文件的绝对地址。

1. LLMS URL: `https://example.com/llms.txt`
2. 构建时会为每个 HTML 页面输出同路径的 Markdown 文件
3. 按 `siteUrl` 生成 `llms.txt` 中 Markdown 的绝对地址

| HTML 文件                        | Markdown 文件                  |
| -------------------------------- | ------------------------------ |
| `dist/zh/guide/quick-start.html` | `dist/zh/guide/quick-start.md` |
| `dist/en/guide/runtime.html`     | `dist/en/guide/runtime.md`     |

```text
# VanillaPress

Markdown source routes for VanillaPress documentation.

## Docs
- https://example.com/zh/guide/quick-start.md
- https://example.com/en/guide/runtime.md
```

## 多语言

`container.labels` 用于配置页面标题下方 `.llms-container` 的多语言文案。key 需要对应 `docs/languages.ts` 中的 locale code，例如 `zh-CN`、`en`。

| 字段    | 说明                       |
| ------- | -------------------------- |
| link    | 查看 Markdown 按钮文本     |
| copy    | 复制 Markdown 链接菜单文本 |
| chatgpt | ChatGPT 打开菜单文本       |
| claude  | Claude 打开菜单文本        |
| options | 下拉按钮的无障碍标签       |
