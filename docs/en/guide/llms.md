# LLMs

Generate `llms.txt` and matching Markdown route files for every page so LLMs can read the source documentation directly.

## Runtime

`build.llms` is enabled by default.

```ts
export default {
  build: {
    llms: true,
  },
}
```

## Metadata

`build.llms: true` is equivalent to using the default configuration.

```ts
export default {
  build: {
    llms: {
      enabled: true, // whether to enable llms feature
      link: true, // whether to enable llms toolbar: View Markdown
      copy: true, // whether to enable llms toolbar: Copy Markdown link
      chatgpt: true, // whether to enable llms toolbar: Open in ChatGPT
      claude: true, // whether to enable llms toolbar: Open in Claude
    },
  },
}
```

- When `enabled: false`, the build skips `vp/config/llms.ts` and does not output `dist/llms.txt` or per-page `.md` files.
- `link`, `copy`, `chatgpt`, and `claude`. If any of them is enabled, the page renders LLMS toolbar below the title of the page.

## Configuration

In `vp/config/llms.ts`, configure the title, description, section title and container labels for `llms.txt`.

```ts
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
}
```

## Output

Based on the address configured in `siteUrl`, generate the corresponding URL and the absolute path to the Markdown file.

1. LLMS URL: `https://example.com/llms.txt`
2. During the build process, a Markdown file at the same path will be output for each HTML page.
3. Generate the absolute path to the Markdown file in `llms.txt` based on `siteUrl`.

| HTML file                        | Markdown file                  |
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

## Localized

`container.labels` configures localized text for the `.vp-editor-helper` rendered below the page title. Keys should match locale codes from `vp/config/languages.ts`, such as `zh-CN` or `en`.

| Field   | Description                              |
| ------- | ---------------------------------------- |
| link    | View Markdown button text                |
| copy    | Copy Markdown link menu text             |
| chatgpt | ChatGPT menu text                        |
| claude  | Claude menu text                         |
| options | Accessible label for the dropdown button |
