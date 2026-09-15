# Sitemap

Help search engines crawl site content more effectively.

## Output Rules

When `siteUrl` is a valid absolute `http(s)` URL, the build outputs `dist/sitemap.xml`. Without a valid `siteUrl`, sitemap output is skipped.

## URL

Based on the `siteUrl` configuration, the corresponding URL addresses are generated.

- Sitemap URL: `https://example.com/sitemap.xml`
- loc URL: `https://example.com/**/*.html`
