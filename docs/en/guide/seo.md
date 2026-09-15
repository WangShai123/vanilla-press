# SEO

Make the documentation site easier to discover in search engines.

## Build

SEO is enabled by default during build and does not need a switch. The build reads `title`, `description`, and `keywords` from Markdown frontmatter and writes them to HTML.

## Example

In the top of a `Markdown` document, use `frontmatter` to configure SEO information.

```markdown
---
title: Documentation Site SEO Configuration Example
description: This is an example of SEO configuration for a documentation site, demonstrating how to use frontmatter in Markdown documents to configure SEO information.
keywords: documentation site, SEO, configuration example
---
```
