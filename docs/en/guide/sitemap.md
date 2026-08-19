# Sitemap

Help search engines crawl site content more effectively.

## Runtime

In `vp/config/runtime.ts`, configure whether sitemap generation is enabled.

```ts
export default {
  siteUrl: 'https://example.com',
  build: {
    sitemap: true,
  },
}
```

## URL

Based on the `siteUrl` configuration, the corresponding URL addresses are generated.

- Sitemap URL: `https://example.com/sitemap.xml`
- loc URL: `https://example.com/**/*.html`
