# 目录

根据文档页面的内容，自动生成目录。默认支持 `h2` 和 `h3`，并且可以通过 `runtime.toc` 配置项来控制是否显示。

## 运行时

在 `vp/config/config.ts` 中，按需配置是否启用目录功能。

```javascript
export default {
  runtime: {
    toc: true,
  },
};
```

## 配置

`runtime.toc: true` 会使用默认配置，等价于：

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

- `runtime.toc.enabled`: 是否启用目录功能，默认值为 `true`。
- `runtime.toc.headings`: 目录支持的标题级别，默认值为 `h2, h3`。
- `runtime.toc.offset`: 滚动定位偏移量，默认值为 `100`。
