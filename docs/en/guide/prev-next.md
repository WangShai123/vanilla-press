# Pagination

Pagination helps users move through documentation pages more efficiently.

## Runtime

In `vp/config/runtime.ts`, configure whether pagination is enabled.

```ts
export default {
  browser: {
    prevNext: true,
  },
}
```

## Slots

Pagination only renders into a `<div data-vp-prev-next></div>` slot provided by the selected layout, then replaces it with `<nav class="vp-prev-next"></nav>`.

- The default documentation layout includes this slot.
- `layout: home` homepage layout does not render pagination by default.
