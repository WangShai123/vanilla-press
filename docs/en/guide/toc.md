# Table of Contents

Automatically generate a table of contents from the page content. By default it supports `h2` and `h3`, and visibility can be controlled through the `runtime.toc` option.

## Runtime

In `docs/config.js`, configure whether the table of contents is enabled.

```javascript
export const docConfig = {
  runtime: {
    toc: true,
  },
};
```

`runtime.toc: true` uses the default configuration, which is equivalent to:

```javascript
export const docConfig = {
  runtime: {
    toc: {
      enabled: true,
      headings: "h2, h3",
    },
  },
};
```

To disable the table of contents, set it to `false`, or set `runtime.toc.enabled: false`.
