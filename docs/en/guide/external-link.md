# External Link

Indicate external links to users.

## Example

[MDN](https://developer.mozilla.org/)

## Build

External link enhancement runs during build and is enabled by default.

```ts
export default {
  server: {
    externalLink: true,
  },
}
```

## Info

When enabled, it matches links whose `href` starts with `http://` or `https://` in the generated HTML.

Matched links receive:

- `target="_blank"`
- `rel="noopener noreferrer"`
- `data-vp-external-link`
- `external-link` icon
