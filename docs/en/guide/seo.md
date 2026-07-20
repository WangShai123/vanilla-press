# SEO

Make the documentation site easier to discover in search engines.

## Runtime

In `docs/config.js`, configure whether SEO is enabled.

```javascript
export const docConfig = {
  runtime: {
    seo: true,
  },
};
```

## Configuration

The `runtime.seo` option is a `boolean` and defaults to `true`.

- `false`: only the HTML title is resolved automatically
- `true`: supports `title`, `description`, and `keywords` in Markdown frontmatter and resolves them automatically

## Example

In the top of a `Markdown` document, use `frontmatter` to configure SEO information.

```markdown
---
title: Documentation Site SEO Configuration Example
description: This is an example of SEO configuration for a documentation site, demonstrating how to use frontmatter in Markdown documents to configure SEO information.
keywords: documentation site, SEO, configuration example
---
```
