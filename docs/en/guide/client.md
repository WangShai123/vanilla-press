# Client Management

`vp/client` manages project-owned browser code. It is designed for MPA-style sites: each page is independent HTML, page scripts are loaded on demand, and shared project code is reused through stable ESM specifiers.

:::tree
vp/client/
├── runtime.ts
├── modules/
│ ├── request.ts
│ └── payment.ts
└── entries/
├── checkout.ts
└── checkout.css
:::

## runtime

`vp/client/runtime.ts` is the project-level public entry. It is built to:

```text
dist/public/client/runtime.js
```

Use the fixed package name from layout scripts or client entries:

```ts
import { request } from 'vanilla-press/client'
```

The page import map is emitted only when the current page actually uses `vanilla-press/client`.

## modules

`vp/client/modules` is for smaller shared modules.

```ts
import { createPayment } from 'vanilla-press/client/modules/payment'
```

The import above resolves to:

```text
vp/client/modules/payment.ts
```

and is emitted as:

```text
dist/public/client/modules/payment.js
```

Modules are not loaded globally. A page declares the import map only when its page script, layout script, or client entry imports that module.

## entries

`vp/client/entries` stores reusable page entry assets and supports `ts/js/css`.

```ts
// vp/client/entries/checkout.ts
import { createPayment } from 'vanilla-press/client/modules/payment'

createPayment()
```

```css
/* vp/client/entries/checkout.css */
.checkout-panel {
  display: grid;
  gap: 1rem;
}
```

Reference an entry from Markdown frontmatter:

```md
---
client:
  entry: checkout
---
```

The built page loads:

```html
<link rel="stylesheet" href="./public/client/entries/checkout.css" />
<script type="module" src="./public/client/entries/checkout.js"></script>
```

The frontmatter value is the entry name. If `checkout.ts` and `checkout.css` both exist, the page loads both the script and stylesheet. If only CSS exists, the page loads only the stylesheet.

Multiple entries are supported:

```md
---
client:
  entry:
    - checkout
    - analytics
---
```

Entries are discovered from `vp/client/entries/**/*.{ts,js,css}` by default. To register files from another location, configure `server.client.entries`. Paths are resolved from the project root:

```ts
export default {
  server: {
    client: {
      entries: {
        dashboard: ['src/client/dashboard.ts', 'src/client/dashboard.css'],
        landing: 'src/client/landing.css',
      },
    },
  },
}
```

## Shared npm Dependencies

npm dependencies used by layout scripts and client entries are bundled locally by default. Put dependencies used by many pages or layouts in `server.client.shared`:

```ts
export default {
  server: {
    client: {
      shared: ['lodash-es'],
    },
  },
}
```

Shared dependencies are bundled into the framework `runtime.js`, and page or layout scripts reuse them through `vanilla-press/runtime`.

Default shared dependencies:

- `vanilla-jui`
- `vanilla-signal`
- `vanilla-create-storage`
- `vanilla-signal-i18n`

## Editor Types

`vanilla-press/client` is typed by the npm package and points to the project `vp/client/runtime.ts`.

`vanilla-press/client/modules/*` is project-dynamic. Configure project `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "vanilla-press/client/modules/*": ["vp/client/modules/*"]
    }
  }
}
```

## Boundaries

- `vp/client/runtime.ts`: project-level browser API.
- `vp/client/modules/*`: reusable business modules.
- `vp/client/entries/*`: frontmatter-driven page scripts or stylesheets.
- `server.client.shared`: npm dependencies reused across pages and layouts.
- `client` config: browser runtime data, not dependency bundling.
