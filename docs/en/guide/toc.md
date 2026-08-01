# Table of Contents

Automatically generate a table of contents from the page content. By default it supports `h2` and `h3`, and visibility can be controlled through the `runtime.toc` option.

## Runtime

In `docs/config.js`, configure whether the table of contents is enabled.

```javascript
export default {
  runtime: {
    toc: true,
  },
};
```

## Configuration

`runtime.toc: true` uses the default configuration, which is equivalent to:

```javascript
export default {
  runtime: {
    toc: {
      enabled: true,
      headings: 'h2, h3',
      offset: 100,
    },
  },
};
```

- `runtime.toc.enabled`: Whether the table of contents is enabled, default is `true`.
- `runtime.toc.headings`: The heading levels supported in the table of contents, default is `h2, h3`.
- `runtime.toc.offset`: The scroll offset for positioning, default is `100`.
