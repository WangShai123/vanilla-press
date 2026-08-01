# External Link

Indicate external links to users.

## Example

[MDN](https://developer.mozilla.org/)

## Runtime

In `docs/config.js`, you can configure whether to enable the external link feature. The default is true.

```javascript
export default {
  runtime: {
    externalLink: true,
  },
};
```

## Info

When enabled, it will match `href` attributes starting with `http://` or `https://` within the **content area** and append:

- `target="_blank"`
- `rel="noopener noreferrer"`
- `external-link` icon
