# Inline Script

`inline-script` lets a Markdown page define JavaScript that belongs only to that page.

During build, `vanilla-press` removes `vp-script` code blocks from the rendered content, merges them into a standalone page script file, and references that file only from the current page HTML.

## Syntax

````markdown
```vp-script
const button = document.querySelector('[data-demo-button]');

button?.addEventListener('click', () => {
  console.log('clicked');
});
```
````

`vp-script` blocks are not rendered as code examples. To display JavaScript examples, keep using `javascript` or `js` code fences.

## Output

If the source document is:

```text
docs/en/guide/api.md
```

the build emits a page-only script:

```text
dist/en/guide/api.xxxxxxxx.js
```

The current page HTML references it automatically:

```html
<script type="module" src="./api.xxxxxxxx.js"></script>
```

Other pages do not reference this script.

## Timing

Page scripts are inserted as `type="module"` scripts after the page runtime.

This means the script can access the current page DOM and is a good fit for interactions that only belong to the current page.

## Shared Dependencies

Inside `vp-script`, you can use static imports from runtime packages that `vanilla-press` already depends on:

```vp-script
import { Toast } from 'vanilla-jui';

const button = document.querySelector('[data-demo-button]');

button?.addEventListener('click', () => {
  Toast.show('clicked');
});
```

These dependencies are reused through the global `runtime.js`, so page scripts do not bundle another copy:

- `vanilla-jui`
- `vanilla-signal`
- `vanilla-create-storage`
- `vanilla-signal-i18n`

The build rewrites these imports and injects an import map automatically. Authors do not need to write the import map by hand.

Other third-party dependencies are not added to `runtime.js`; they are bundled only into the current page script, such as `api.xxxxxxxx.js`.

## Configuration

`runtime.inlineScript` is an internal runtime capability. It is enabled by default, not exposed as public configuration, and cannot be disabled.
