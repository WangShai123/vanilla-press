# SEO

让文档站点在搜索引擎中更容易被发现。

## 运行时

在 `docs/config.js` 中，按需配置是否启用 SEO 功能。

```javascript
export const docConfig = {
  runtime: {
    seo: true,
  },
};
```

## 配置

`runtime.seo` 配置类型为 `boolean`，默认值为 `true`。

- `false`: 仅自动解析 html title
- `true`: 支持在 `markdown` 文档中使用 `frontmatter` 配置 `title`、`description`、`keywords`，并自动解析。

## 示例

在 `markdown` 文档的顶部，使用 `frontmatter` 配置 SEO 信息。

```markdown
---
title: 文档站点 SEO 配置示例
description: 这是一个文档站点 SEO 配置示例，展示如何在 markdown 文档中使用 frontmatter 配置 SEO 信息。
keywords: 文档站点, SEO, 配置示例
---
```
