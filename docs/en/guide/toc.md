# Table of Contents

Automatically generate a table of contents from the page content. By default it supports `h2` and `h3`, and visibility can be controlled through the `client.toc` option.

## Runtime

In `vp/config/runtime.ts`, configure whether the table of contents is enabled.

```ts
export default {
  client: {
    toc: true,
  },
}
```

## Configuration

`client.toc: true` uses the default configuration, which is equivalent to:

```ts
export default {
  client: {
    toc: {
      enabled: true,
      headings: 'h2, h3',
      offset: 100,
    },
  },
}
```

- `client.toc.enabled`: Whether the table of contents is enabled, default is `true`.
- `client.toc.headings`: The heading levels supported in the table of contents, default is `h2, h3`.
- `client.toc.offset`: The scroll offset for positioning, default is `100`.
