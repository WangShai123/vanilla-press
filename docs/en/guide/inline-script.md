# Inline Script

`inline-script` lets a Markdown page define JavaScript that belongs only to that page.

During build, `vanilla-press` removes `vp-script` code blocks from the rendered content, merges them into a standalone page script file, and references that file only from the current page HTML.

## Demo

<button data-demo-button class="j-button is-outline">Click me</button>

```vp-script
import { Toast } from 'vanilla-jui';
import { createSignal, createEffect } from 'vanilla-signal';

const button = document.querySelector('[data-demo-button]');

const [toast, setToast] = createSignal(false);
button?.addEventListener('click', () => {
  if (toast()) return;
  setToast(true);
  const [loading, setLoading] = createSignal(true);
  Toast.primary('Click me successfully.',{
    loading,
    onCancel: () => {
      setLoading(false);
      Toast.lite('Loading canceled');
      setToast(false);
    },
  });
  setTimeout(() => {setLoading(false); setToast(false)}, 2000);
});
createEffect(() => {
  button.disabled = toast();
});
```

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
dist/en/guide/xx.hash.js
```

The current page HTML references it automatically:

```html
<script type="module" src="./xx.hash.js"></script>
```

Other pages do not reference this script.

## Timing

Page scripts are inserted as `type="module"` scripts after the page runtime.

This means the script can access the current page DOM and is a good fit for interactions that only belong to the current page.

## Static Imports

Inside `vp-script`, you can use static imports from local npm dependencies:

````markdown
```vp-script
import { Toast } from 'vanilla-jui';

const button = document.querySelector('[data-demo-button]');

button?.addEventListener('click', () => {
  Toast.show('clicked');
});
```
````

## Dependency Management

`vanilla-press` uses this dependency management strategy:

- Shared dependencies: dependencies bundled into `runtime.js` and reused by all page scripts.
- Independent dependencies: dependencies that belong only to the current page's own `xx.hash.js`.

During build, `vanilla-press` uses the shared dependency whitelist to decide which dependencies are shared and which dependencies are independent.

- When `vp-script` statically imports a valid shared dependency, the build rewrites that import to read from `runtime.js` and injects an import map into the current page. Users do not need to write the import map by hand.
- Static imports that are not in the shared list are bundled only into the current page's own `xx.hash.js`.

## Shared Dependency Whitelist

Users can extend the shared dependency whitelist in `docs/config.ts`:

```javascript
export default {
  runtime: {
    inlineScript: {
      shared: ["lodash-es"],
    },
  },
};
```

`runtime.inlineScript.shared` is merged with the default list. It does not replace the defaults.

Default shared dependency whitelist:

- `vanilla-jui`
- `vanilla-signal`
- `vanilla-create-storage`
- `vanilla-signal-i18n`

## Configuration

`runtime.inlineScript` is enabled by default and cannot be disabled. The public configuration only controls `shared`, which lets you decide which local npm dependencies should be bundled into `runtime.js` for reuse by page scripts.
