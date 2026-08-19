# 分页导航

帮助用户快速浏览文档的分页导航功能。

## 运行时

在 `vp/config/runtime.ts` 中，按需配置是否启用分页导航功能。

```ts
export default {
  browser: {
    prevNext: true,
  },
}
```

## 插槽

分页导航只会渲染到当前布局声明的 `<div data-vp-prev-next></div>` 插槽中，然后替换为 `<nav class="vp-prev-next"></nav>`。

- 默认文档布局已包含该插槽。
- `layout: home` 首页布局默认不渲染分页导航。
