# Robots

Generate `robots.txt` to tell search engines which paths they can crawl.

## Runtime Switch

`runtime.robots` is enabled by default. Only `false` disables it. When disabled, the build skips `docs/robots.js` and does not output `dist/robots.txt`.

```javascript
export const docConfig = {
  runtime: {
    robots: false,
  },
};
```

## Configuration File

Configure the generated content in `docs/robots.js`. Project configuration replaces the default configuration.

```javascript
export const robots = {
  rules: [
    {
      userAgent: "*",
      allow: ["/"],
      disallow: ["/private/"],
    },
  ],
  sitemap: true,
  llms: true,
};
```

## Fields

| Field      | Type                      | Description                                                     |
| ---------- | ------------------------- | --------------------------------------------------------------- |
| rules      | array                     | Rule groups for `robots.txt`. Each item outputs a `User-agent` block. |
| userAgent  | string \| array           | Crawler name. Defaults to `*`.                                  |
| allow      | string \| array           | Outputs `Allow` rules.                                          |
| disallow   | string \| array           | Outputs `Disallow` rules.                                       |
| crawlDelay | string \| number          | Outputs a `Crawl-delay` rule.                                   |
| sitemap    | boolean \| string \| array | `true` outputs `${siteUrl}/sitemap.xml`; strings define custom URLs. |
| llms       | boolean \| string \| array | `true` outputs `${siteUrl}/llms.txt`; strings define custom URLs. |

## Output

After build, visit:

`https://example.com/robots.txt`
