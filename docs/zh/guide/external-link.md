# 外部链接

向用户指示站外链接。

## 示例

[MDN](https://developer.mozilla.org/)

## 构建

外部链接增强在构建阶段执行，默认启用。

```ts
export default {
  server: {
    externalLink: true,
  },
}
```

## 说明

启用后会匹配 HTML 中 `href` 以 `http://` 或 `https://` 开头的链接。

匹配到的链接会追加：

- `target="_blank"`
- `rel="noopener noreferrer"`
- `data-vp-external-link`
- `external-link` 图标
