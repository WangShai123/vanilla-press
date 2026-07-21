# Runtime

`vanilla-press` builds and renders runtime features on demand based on the configuration in `docs/config.js`.

## Configuration Object

The `docConfig` object in `docs/config.js` is used to configure site runtime data.

| Option                              | Type              | Default        | Description                                                                                   |
| ----------------------------------- | ----------------- | -------------- | --------------------------------------------------------------------------------------------- |
| siteName                            | string            | "VanillaPress" | Site name. Falls back to "VanillaPress" when omitted.                                         |
| siteUrl                             | string            | Required       | Absolute deployment URL such as `https://example.com`. Build fails if missing or not http(s). |
| runtime                             | object            | -              | Runtime feature configuration object.                                                         |
| `runtime.seo`                       | boolean           | true           | Whether to enable SEO. Set to `false` to disable it.                                          |
| `runtime.search`                    | boolean           | true           | Whether to enable search. Set to `false` to disable it.                                       |
| `runtime.highlight`                 | boolean           | true           | Whether to enable code highlighting. Set to `false` to disable it.                            |
| `runtime.menu`                      | boolean           | true           | Whether to enable the top menu. Set to `false` to disable it.                                 |
| `runtime.sidebar`                   | boolean           | true           | Whether to enable the sidebar. Set to `false` to disable it.                                  |
| `runtime.toc`                       | boolean \| object | true           | Whether to enable the page table of contents.                                                 |
| `runtime.toc.enabled`               | boolean           | true           | Whether to enable the table of contents. Set to `false` to disable it.                        |
| `runtime.toc.headings`              | string            | "h2, h3"       | Heading selector used to build the table of contents.                                         |
| `runtime.prevNext`                  | boolean \| object | false          | Whether to enable previous/next page navigation.                                              |
| `runtime.sitemap`                   | boolean \| object | false          | Whether to output `sitemap.xml` into `dist/`.                                                 |
| `runtime.robots`                    | boolean           | true           | Whether to output `robots.txt` into `dist/`. Set to `false` to disable it.                    |
| `runtime.llms`                      | boolean \| object | true           | Whether to output `llms.txt`, per-page Markdown routes, and page Markdown actions.            |
| `runtime.llms.enabled`              | boolean           | true           | Whether to enable LLMs. Set to `false` to disable it.                                         |
| `runtime.llms.link`                 | boolean           | true           | Whether to render the "View Markdown" button below the content title.                         |
| `runtime.llms.copy`                 | boolean           | true           | Whether to render the copy Markdown link action in the LLMs menu.                             |
| `runtime.llms.chatgpt`              | boolean           | true           | Whether to render the ChatGPT action in the LLMs menu.                                        |
| `runtime.llms.claude`               | boolean           | true           | Whether to render the Claude action in the LLMs menu.                                         |
| `runtime.i18n`                      | object            | Enabled        | Internationalization configuration object.                                                    |
| `runtime.i18n.enabled`              | boolean           | true           | Whether to enable i18n.                                                                       |
| `runtime.i18n.defaultLocale`        | string            | "zh-CN"        | Default language.                                                                             |
| `runtime.i18n.redirectToDefault`    | boolean           | true           | Whether to redirect to the default locale.                                                    |
| `runtime.theme`                     | boolean \| object | Enabled        | Theme configuration.                                                                          |
| `runtime.theme.enabled`             | boolean           | true           | Whether to enable the theme feature.                                                          |
| `runtime.theme.label`               | string            | "theme.button" | i18n key for the theme button label.                                                          |
| `runtime.theme.options`             | object            | -              | Options object passed to `vanilla-jui` Theme.                                                 |
| `runtime.theme.panel`               | object \| null    | -              | Panel configuration passed to `theme.createPanel()`.                                          |
| `runtime.theme.offcanvas`           | object            | -              | Offcanvas configuration object for the theme panel.                                           |
| `runtime.theme.offcanvas.direction` | string            | "right"        | Direction of the theme panel offcanvas.                                                       |
| components                          | object            | -              | Markdown component configuration object.                                                      |
| `components.tree`                   | boolean \| object | false          | Whether to enable the tree file-directory component.                                          |
| `components.tree.enabled`           | boolean           | false          | In object form, must be set to `true` to enable it.                                           |
| `components.tree.fileIcon`          | boolean           | true           | Render file icons by file extension when enabled.                                             |
| social                              | object            | -              | Footer social links object. Keys are icon names and values are URLs.                          |

## Default Configuration

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
    robots: true,
    llms: {
      enabled: true,
      link: true,
      copy: true,
      chatgpt: true,
      claude: true,
    },
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
