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
| `runtime.externalLink`              | boolean           | true           | Whether to enhance external links in the content area. Set to `false` to disable it.          |
| `runtime.highlight`                 | boolean \| object | true           | Whether to enable code highlighting. Set to `false` to disable it.                            |
| `runtime.highlight.enabled`         | boolean           | true           | Whether to enable code highlighting. Set to `false` to disable it.                            |
| `runtime.highlight.languages`       | array             | Default list   | Supported highlight languages. Only listed `highlight.js` language modules are registered.    |
| `runtime.menu`                      | boolean           | true           | Whether to enable the top menu. Set to `false` to disable it.                                 |
| `runtime.sidebar`                   | boolean           | true           | Whether to enable the sidebar. Set to `false` to disable it.                                  |
| `runtime.toc`                       | boolean \| object | true           | Whether to enable the page table of contents.                                                 |
| `runtime.toc.enabled`               | boolean           | true           | Whether to enable the table of contents. Set to `false` to disable it.                        |
| `runtime.toc.headings`              | string            | "h2, h3"       | Heading selector used to build the table of contents.                                         |
| `runtime.toc.offset`                | number            | 80             | Scroll positioning offset.                                                                    |
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
| `runtime.theme.default`             | object            | -              | Initial theme values used by the inline boot script.                                          |
| `runtime.theme.default.mode`        | "dark" \| "light" | "dark"        | Initial color mode. Invalid values fall back to "dark".                                      |
| `runtime.theme.default.theme`       | enum              | "indigo"      | Initial palette: gray, olive, tomato, ruby, pink, violet, indigo, blue, teal, grass, mint, lime, yellow, orange, gold. |
| `runtime.theme.default.radius`      | enum              | "sm"          | Initial radius: sm, md, lg, xl, round.                                                        |
| `runtime.theme.default.shadow`      | enum              | "sm"          | Initial shadow: none, sm, md, lg.                                                            |
| `runtime.theme.default.font`        | enum              | "sm"          | Initial font size: sm, md.                                                                    |
| `runtime.theme.label`               | string            | "theme.button" | i18n key for the theme button label.                                                          |
| `runtime.theme.options`             | object            | -              | Options object passed to `vanilla-jui` Theme.                                                 |
| `runtime.theme.panel`               | object \| null    | -              | Panel configuration passed to `theme.createPanel()`.                                          |
| `runtime.theme.offcanvas`           | object            | -              | Offcanvas configuration object for the theme panel.                                           |
| `runtime.theme.offcanvas.direction` | string            | "right"        | Direction of the theme panel offcanvas.                                                       |
| social                              | object            | -              | Footer social links object. Keys are icon names and values are URLs.                          |

## External Links

`runtime.externalLink` is enabled by default. When enabled, links inside `.j-content` whose `href` starts with `http://` or `https://` receive:

- `target="_blank"`
- `rel="noopener noreferrer"`
- the `external-link` icon

Set it to `false` to disable this behavior:

```javascript
export const docConfig = {
  runtime: {
    externalLink: false,
  },
};
```

## Default Configuration

```javascript
export const docConfig = {
  siteName: "VanillaPress",
  siteUrl: "https://example.com",
  runtime: {
    seo: true,
    search: true,
    externalLink: true,
    highlight: {
      enabled: true,
      languages: [
        { value: "plaintext", label: "Plain Text" },
        { value: "bash", label: "Bash" },
        { value: "c", label: "C" },
        { value: "cpp", label: "C++" },
        { value: "css", label: "CSS" },
        { value: "dockerfile", label: "Dockerfile" },
        { value: "go", label: "Go" },
        { value: "graphql", label: "GraphQL" },
        { value: "html", label: "HTML" },
        { value: "java", label: "Java" },
        { value: "javascript", label: "JavaScript" },
        { value: "json", label: "JSON" },
        { value: "kotlin", label: "Kotlin" },
        { value: "markdown", label: "Markdown" },
        { value: "nginx", label: "Nginx" },
        { value: "php", label: "PHP" },
        { value: "python", label: "Python" },
        { value: "ruby", label: "Ruby" },
        { value: "rust", label: "Rust" },
        { value: "sql", label: "SQL" },
        { value: "swift", label: "Swift" },
        { value: "typescript", label: "TypeScript" },
        { value: "xml", label: "XML" },
        { value: "yaml", label: "YAML" },
      ],
    },
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
      default: {
        mode: "dark",
        theme: "indigo",
        radius: "sm",
        shadow: "sm",
        font: "sm",
      },
      offcanvas: {
        direction: "right",
      },
    },
  },
  social: {
    github: "https://github.com/WangShai123/vanilla-press",
  },
};
```
