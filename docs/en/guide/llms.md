# LLMs

Generate `llms.txt` and matching Markdown route files for every page so LLMs can read the source documentation directly.

## Runtime

`runtime.llms` is enabled by default. Set it to `false`, or set `enabled: false` in object form, to disable it. When disabled, the build skips `docs/llms.js` and does not output `dist/llms.txt` or per-page `.md` files.

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

`link`, `copy`, `chatgpt`, and `claude` are enabled by default. If any of them is enabled, the page renders `.llms-container` below the main content `h1`.

## Configuration

Configure the title, description, section title and container labels for `llms.txt` in `docs/llms.js`.

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

## Output

LLMS URL: `https://example.com/llms.txt`

The build writes a Markdown file beside each HTML page:

| HTML file                        | Markdown file                  |
| -------------------------------- | ------------------------------ |
| `dist/zh/guide/quick-start.html` | `dist/zh/guide/quick-start.md` |
| `dist/en/guide/runtime.html`     | `dist/en/guide/runtime.md`     |

`llms.txt` lists absolute Markdown route URLs based on `siteUrl`:

```text
# VanillaPress

Markdown source routes for VanillaPress documentation.

## Docs
- https://example.com/zh/guide/quick-start.md
- https://example.com/en/guide/runtime.md
```

## Localized

`container.labels` configures localized text for the `.llms-container` rendered below the page title. Keys should match locale codes from `docs/languages.js`, such as `zh-CN` or `en`.

| Field   | Description                              |
| ------- | ---------------------------------------- |
| link    | View Markdown button text                |
| copy    | Copy Markdown link menu text             |
| chatgpt | ChatGPT menu text                        |
| claude  | Claude menu text                         |
| options | Accessible label for the dropdown button |

## Toolbar

When `link` is enabled, the page shows a LLMS toolbar below the title. It contains two kinds of action:

Button "View Markdown", it opens the current page's `.md` URL in a new tab.

When `copy`, `chatgpt`, or `claude` is enabled, the page shows an LLMs dropdown button. The menu contains the enabled actions:

- Copy Markdown link
- Open in ChatGPT
- Open in Claude

## Robots

`docs/robots.js` can output the `llms.txt` URL in `robots.txt` with `llms: true`.
