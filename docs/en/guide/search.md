# Search

A static search feature with search assets isolated by language.

## Runtime

In `docs/config.js`, configure whether search is enabled.

```javascript
export const docConfig = {
  runtime: {
    search: true,
  },
};
```

When search is disabled, the build does not emit `search.js`, and pages do not render a search entry.

## Index File

When building the search functionality, `search.js` will be output as the search index file.

## Lazy Loading

When the page is visited, the search index file is not downloaded directly. The search index is only dynamically loaded and the search pop-up window is opened when the user clicks the search button.

As a project grows, the size of the search index file will also increase. Lazy loading can improve page load speed, main process efficiency, and user experience.
