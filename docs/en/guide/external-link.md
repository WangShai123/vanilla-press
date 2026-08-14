# External Link

Indicate external links to users.

## Example

[MDN](https://developer.mozilla.org/)

## Runtime

In `vp/config/config.ts`, you can configure whether to enable the external link feature. The default is true.

```javascript
export default {
  runtime: {
    externalLink: true,
  },
};
```

## Info

When enabled, it matches links whose `href` starts with `http://` or `https://` inside these areas:

- `[data-doc-editor]`
- `[data-doc-menu]`
- `[data-doc-sidebar]`

Matched links receive:

- `target="_blank"`
- `rel="noopener noreferrer"`
- `data-doc-external-link`
- `external-link` icon
