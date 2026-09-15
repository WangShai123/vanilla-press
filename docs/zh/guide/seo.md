# SEO

让文档站点在搜索引擎中更容易被发现。

## 构建

SEO 是默认构建功能，不需要开关配置。构建阶段会读取 Markdown frontmatter 中的 `title`、`description`、`keywords`，并输出到 HTML。

## 示例

在 `markdown` 文档的顶部，使用 `frontmatter` 配置 SEO 信息。

```markdown
---
title: 文档站点 SEO 配置示例
description: 这是一个文档站点 SEO 配置示例，展示如何在 markdown 文档中使用 frontmatter 配置 SEO 信息。
keywords: 文档站点, SEO, 配置示例
---
```
