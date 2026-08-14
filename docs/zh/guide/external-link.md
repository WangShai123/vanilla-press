# 外部链接

向用户指示站外链接。

## 示例

[MDN](https://developer.mozilla.org/)

## 运行时

在 `vp/config/config.ts` 中，按需配置是否启用外部链接功能。默认启用。

```javascript
export default {
  runtime: {
    externalLink: true,
  },
};
```

## 说明

启用后会匹配以下区域内 `href` 以 `http://` 或 `https://` 开头的链接：

- `[data-doc-editor]`
- `[data-doc-menu]`
- `[data-doc-sidebar]`

匹配到的链接会追加：

- `target="_blank"`
- `rel="noopener noreferrer"`
- `data-doc-external-link`
- `external-link` 图标
