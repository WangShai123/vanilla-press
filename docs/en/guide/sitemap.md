# Sitemap

Help search engines crawl site content more effectively.

## Runtime

In `vp/config/config.ts`, configure whether sitemap generation is enabled.

```javascript
export default {
  siteUrl: 'https://example.com',
  runtime: {
    sitemap: true,
  },
};
```

## URL

Based on the `siteUrl` configuration, the corresponding URL addresses are generated.

- Sitemap URL: `https://example.com/sitemap.xml`
- loc URL: `https://example.com/**/*.html`
