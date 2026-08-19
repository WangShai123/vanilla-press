# Robots

Generate `robots.txt` to tell search engines which paths they can crawl.

## Runtime

`build.robots` is enabled by default.

```ts
export default {
  build: {
    robots: false,
  },
}
```

When `build.robots` is `false`, the build does not output `dist/robots.txt`.

## Configuration

Configure the generated content in `vp/config/robots.ts`.

```ts
export default {
  rules: [
    {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/private/'],
    },
  ],
}
```

## Fields

| Field      | Type             | Description                                                           |
| ---------- | ---------------- | --------------------------------------------------------------------- |
| rules      | array            | Rule groups for `robots.txt`. Each item outputs a `User-agent` block. |
| userAgent  | string \| array  | Crawler name. Defaults to `*`.                                        |
| allow      | string \| array  | Outputs `Allow` rules.                                                |
| disallow   | string \| array  | Outputs `Disallow` rules.                                             |
| crawlDelay | string \| number | Outputs a `Crawl-delay` rule.                                         |

## Output

Based on the `siteUrl` configuration, the corresponding URL addresses are generated.

- Robots URL:`https://example.com/robots.txt`
