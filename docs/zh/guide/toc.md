# 目录

根据文档页面的内容，自动生成目录。默认支持 `h2` 和 `h3`，并且可以通过 `runtime.toc` 配置项来控制是否显示。

## 运行时

在 `docs/config.js` 中，按需配置是否启用目录功能。

```javascript
export const docConfig = {
  runtime: {
    toc: true,
  },
};
```

`runtime.toc: true` 会使用默认配置，等价于：

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

需要关闭目录时，可以设置为 `false`，或设置 `runtime.toc.enabled: false`。
