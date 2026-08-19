# 目录

根据文档页面的内容，自动生成目录。默认支持 `h2` 和 `h3`，并且可以通过 `browser.toc` 配置项来控制是否显示。

## 运行时

在 `vp/config/runtime.ts` 中，按需配置是否启用目录功能。

```ts
export default {
  browser: {
    toc: true,
  },
}
```

## 配置

`browser.toc: true` 会使用默认配置，等价于：

```ts
export default {
  browser: {
    toc: {
      enabled: true,
      headings: 'h2, h3',
      offset: 100,
    },
  },
}
```

- `browser.toc.enabled`: 是否启用目录功能，默认值为 `true`。
- `browser.toc.headings`: 目录支持的标题级别，默认值为 `h2, h3`。
- `browser.toc.offset`: 滚动定位偏移量，默认值为 `100`。
