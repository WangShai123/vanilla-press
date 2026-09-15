# Pagination

Pagination helps users move through documentation pages more efficiently.

## Build

Pagination is rendered during build and configured with `server.prevNext`.

```ts
export default {
  server: {
    prevNext: true,
  },
}
```

## Slots

Pagination only renders into a `<div data-vp-prev-next></div>` slot provided by the selected layout.

- The default documentation layout includes this slot.
- `layout: home` homepage layout does not render pagination by default.
