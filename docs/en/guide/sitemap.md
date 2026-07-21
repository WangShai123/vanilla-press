# Sitemap

Help search engines crawl site content more effectively.

## Runtime

In `docs/config.js`, configure whether sitemap generation is enabled.

```javascript
export const docConfig = {
  siteUrl: "https://example.com",
  runtime: {
    sitemap: true,
  },
};
```

Sitemap URL: `https://example.com/sitemap.xml`

## URL

In the sitemap, the `loc` URL is generated based on the `siteUrl` configuration.
