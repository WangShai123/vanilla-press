# Runtime

`VanillaPress` builds and renders runtime features on demand based on the configuration in `docs/config.js`.

## Configuration Object

The `docConfig` object in `docs/config.js` is used to configure site runtime data.

| Option                      | Type              | Default        | Description                                                                                   |
| --------------------------- | ----------------- | -------------- | --------------------------------------------------------------------------------------------- |
| siteName                    | string            | "VanillaPress" | Site name. Falls back to "VanillaPress" when omitted.                                         |
| siteUrl                     | string            | Required       | Absolute deployment URL such as `https://example.com`. Build fails if missing or not http(s). |
| seo                         | boolean           | true           | Whether to enable SEO. Set to `false` to disable it.                                          |
| search                      | boolean           | true           | Whether to enable search. Set to `false` to disable it.                                       |
| highlight                   | boolean           | true           | Whether to enable code highlighting. Set to `false` to disable it.                            |
| menu                        | boolean           | true           | Whether to enable the top menu. Set to `false` to disable it.                                 |
| sidebar                     | boolean           | true           | Whether to enable the sidebar. Set to `false` to disable it.                                  |
| toc                         | boolean \| object | true           | Whether to enable the page table of contents.                                                 |
| `toc.enabled`               | boolean           | true           | Whether to enable the table of contents. Set to `false` to disable it.                        |
| `toc.headings`              | string            | "h2, h3"       | Heading selector used to build the table of contents.                                         |
| tree                        | boolean \| object | false          | Whether to enable the tree file-directory component.                                          |
| `tree.enabled`              | boolean           | false          | In object form, must be set to `true` to enable it.                                           |
| `tree.fileIcon`             | boolean           | true           | Render file icons by file extension when enabled.                                             |
| prevNext                    | boolean \| object | false          | Whether to enable previous/next page navigation.                                              |
| sitemap                     | boolean \| object | false          | Whether to output `sitemap.xml` into `dist/`.                                                 |
| i18n                        | object            | Enabled        | Internationalization configuration object.                                                    |
| `i18n.enabled`              | boolean           | true           | Whether to enable i18n.                                                                       |
| `i18n.defaultLocale`        | string            | "zh-CN"        | Default language.                                                                             |
| `i18n.redirectToDefault`    | boolean           | true           | Whether to redirect to the default locale.                                                    |
| theme                       | boolean \| object | Enabled        | Theme configuration.                                                                          |
| `theme.enabled`             | boolean           | true           | Whether to enable the theme feature.                                                          |
| `theme.label`               | string            | "theme.button" | i18n key for the theme button label.                                                          |
| `theme.options`             | object            | -              | Options object passed to `vanilla-jui` Theme.                                                 |
| `theme.panel`               | object \| null    | -              | Panel configuration passed to `theme.createPanel()`.                                          |
| `theme.offcanvas`           | object            | -              | Offcanvas configuration object for the theme panel.                                           |
| `theme.offcanvas.direction` | string            | "right"        | Direction of the theme panel offcanvas.                                                       |
| footer                      | object            | -              | Footer configuration object.                                                                  |
| `footer.text`               | string            | "footer.text"  | Footer text or an i18n key.                                                                   |

## Default Configuration

```javascript
export const docConfig = {
  siteName: "VanillaPress",
  siteUrl: "https://example.com",
  seo: true,
  search: true,
  highlight: true,
  menu: true,
  sidebar: true,
  toc: true,
  tree: false,
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
  footer: {
    text: "footer.text",
  },
};
```
