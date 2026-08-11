# Robots

Generate `robots.txt` to tell search engines which paths they can crawl.

## Runtime

`runtime.robots` is enabled by default.

```javascript
export default {
  runtime: {
    robots: false,
  },
};
```

When `runtime.robots` is `false`, the build does not output `dist/robots.txt`.

## Configuration

Configure the generated content in `docs/robots.ts`.

```javascript
export default {
  rules: [
    {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/private/'],
    },
  ],
};
```

## Fields

| Field      | Type                       | Description                                                           |
| ---------- | -------------------------- | --------------------------------------------------------------------- |
| rules      | array                      | Rule groups for `robots.txt`. Each item outputs a `User-agent` block. |
| userAgent  | string \| array            | Crawler name. Defaults to `*`.                                        |
| allow      | string \| array            | Outputs `Allow` rules.                                                |
| disallow   | string \| array            | Outputs `Disallow` rules.                                             |
| crawlDelay | string \| number           | Outputs a `Crawl-delay` rule.                                         |

## Output

Based on the `siteUrl` configuration, the corresponding URL addresses are generated.

- Robots URL:`https://example.com/robots.txt`
