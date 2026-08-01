# Pagination

Pagination helps users move through documentation pages more efficiently.

## Runtime

In `docs/config.ts`, configure whether pagination is enabled.

```javascript
export default {
  runtime: {
    prevNext: true,
  },
};
```

## Slots

Pagination only renders into a `<div data-doc-prev-next></div>` slot provided by the selected layout.

- The default documentation layout includes this slot.
- `layout: home` homepage layout does not render pagination by default.
