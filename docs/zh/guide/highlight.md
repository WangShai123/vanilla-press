# 代码高亮

基于 `highlight.js` 的代码高亮，支持多种语言。

## 运行时

在 `docs/config.js` 中，按需配置是否启用代码高亮功能。

```javascript
export const docConfig = {
  runtime: {
    highlight: true,
  },
};
```

## 示例

```javascript
// javascript
const pages = ["index.md", "guide/components.md"];

export function toHtml(file) {
  return file.replace(/\.md$/, ".html");
}
```
