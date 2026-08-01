# 外部链接

向用户指示站外链接。

## 示例

[MDN](https://developer.mozilla.org/)

## 运行时

在 `docs/config.ts` 中，按需配置是否启用外部链接功能。默认启用。

```javascript
export default {
  runtime: {
    externalLink: true,
  },
};
```

## 说明

启用后会匹配 **正文区域** 内的 `href` 以 `http://` 或 `https://` 开头的链接，并追加：

- `target="_blank"`
- `rel="noopener noreferrer"`
- `external-link` 图标
