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

- `[data-vp-editor]`
- `[data-vp-menu]`
- `[data-vp-sidebar]`

Matched links receive:

- `target="_blank"`
- `rel="noopener noreferrer"`
- `data-vp-external-link`
- `external-link` icon
