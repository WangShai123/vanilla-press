# Search

A static search feature with search assets isolated by language.

## Runtime

In `vp/config/runtime.ts`, configure whether search is enabled.

```ts
export default {
  client: {
    search: true,
  },
}
```

When search is disabled, the server does not emit `search.js`, and pages do not render a search entry.

## Index File

Search index files are emitted based on whether the site uses multiple languages.

Without multiple languages, the build emits one shared data file:

```text
dist/public/search.js
```

With multiple languages, the build splits the files by `server.i18n.locales[].path`. If the language paths are `zh` and `en`, the output is:

```text
dist/public/search.zh.js
dist/public/search.en.js
```

Pages dynamically load the matching language data file when search is opened. For example, `zh` pages load `search.zh.js`, and `en` pages load `search.en.js`.

## Lazy Loading

When the page is visited, the search index file is not downloaded directly. The search index is only dynamically loaded and the search pop-up window is opened when the user clicks the search button.

As a project grows, the size of the search index file will also increase. Lazy loading can improve page load speed, main process efficiency, and user experience.
