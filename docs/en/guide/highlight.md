# Code Highlighting

Code highlighting is powered by `highlight.js` and supports multiple languages.

## Runtime

In `docs/config.js`, configure whether code highlighting is enabled.

```javascript
export const docConfig = {
  // Whether to enable code highlighting
  highlight: true,
};
```

## Example

```javascript
// javascript
const pages = ["index.md", "guide/components.md"];

export function toHtml(file) {
  return file.replace(/\.md$/, ".html");
}
```
