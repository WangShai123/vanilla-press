# Runtime Config

`vp/config/runtime.ts` describes site data, build-stage data, and browser runtime data.

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
        { code: 'zh-CN', label: 'Simplified Chinese', path: 'zh' },
        { code: 'en', label: 'English', path: 'en' },
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

## Top-Level Options

| Option   | Type   | Description                       |
| -------- | ------ | --------------------------------- |
| siteName | string | Site name                         |
| siteUrl  | string | Absolute `http(s)` deployment URL |
| server   | object | Server-stage build data           |
| client   | object | Browser runtime data              |

## server

`server` stores user-defined data needed at build time. Build-time features are mostly convention-driven instead of being modeled as toggle-heavy configuration.

| Option                 | Type                 | Description                                                   |
| ---------------------- | -------------------- | ------------------------------------------------------------- |
| server.social          | object               | Header and footer social links. Keys are icon names and values URLs. |
| server.footerScript    | "script" \| "module" | Script type for `vp/config/footerScript.ts` output            |
| server.highlight.light | string               | Light Shiki theme. Defaults to `github-light-default`         |
| server.highlight.dark  | string               | Dark Shiki theme. Defaults to `github-dark-default`           |
| server.externalLink    | boolean              | Build-time external link enhancement. Enabled by default.     |
| server.prevNext        | boolean \| object    | Build-time previous/next page navigation                      |
| server.i18n            | object               | Build-time internationalization metadata                      |
| server.client.entries  | object               | Custom client entry script or stylesheet entries              |
| server.client.shared   | array \| object      | Shared npm dependencies for layout scripts and client entries |
| server.llms            | object               | LLMs output and page Markdown action data                     |
| server.editLink        | object               | Edit link data                                                |
| server.lastEdit        | object               | Last updated display data                                     |
| icp                    | string               | ICP number. Omitted means no ICP text is rendered.            |

## client

`client` describes browser runtime data.

| Option            | Type              | Description                  |
| ----------------- | ----------------- | ---------------------------- |
| client.editorSize | boolean \| string | Content editor size controls |
| client.search     | boolean           | Search                       |
| client.toc        | boolean \| object | Page table of contents       |
| client.theme      | object            | Theme                        |

## Conventions

- `vp/config/menu.ts` renders the menu when it exports a valid menu array.
- `vp/config/sidebar.ts` or directory-level `sidebar.ts` renders the sidebar when it exports a valid sidebar array.
- Non-empty `vp/config/footerScript.ts` outputs a footer script.
- `server.highlight` customizes Shiki themes; missing values use defaults.
- SEO and translated text are always handled during build.
- Pages using layout scripts or client entries output only the scripts and stylesheets they need.
