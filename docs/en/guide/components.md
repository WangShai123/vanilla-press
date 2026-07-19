# Components

`vanilla-press` components are a set of Markdown container components built on top of `vanilla-jui` for document layout and interactions.

## Tabs

:::tabs
@tab JavaScript

```javascript
// javascript
const pages = ["index.md", "guide/components.md"];

export function toHtml(file) {
  return file.replace(/\.md$/, ".html");
}
```

@tab HTML

```html
<article class="j-content is-sm">
  <h1>Component Example</h1>
  <p>Main content uses vanilla-jui content classes.</p>
</article>
```

@tab Syntax

```markdown
:::tabs
@tab Option A

Content A

@tab Option B

Content B

:::
```

:::

## Accordion

:::tabs
@tab Demo

:::accordion multiple collapsible
@item Supports directory-based routing

`docs/en/guide/components.md` will be generated to `dist/en/guide/components.html`, and asset links are resolved automatically.

@item Supports code highlighting

Code blocks keep `language-*` classes and render base token styles.

@item Supports page-level component init

Each page injects its own `initDocPage({ components: [...] })` script.
:::

@tab Syntax

```markdown
:::accordion multiple collapsible
@item Supports directory-based routing

`docs/en/guide/components.md` will be generated to `dist/en/guide/components.html`, and asset links are resolved automatically.

@item Supports code highlighting

Code blocks keep `language-*` classes and render base token styles.

@item Supports page-level component init

Each page injects its own `initDocPage({ components: [...] })` script.
:::
```

:::

#### Parameters

- `multiple`: whether multiple panels can stay expanded at the same time; false when omitted
- `collapsible`: whether all panels can be collapsed; false when omitted

## Offcanvas

:::tabs
@tab Demo

:::offcanvas [Open Panel] left

### Offcanvas

In the `Offcanvas` component, content is wrapped inside a panel container. Click the trigger button to open or close the panel.

Markdown syntax is supported inside the panel content.

```javascript
// javascript
const pages = ["index.md", "guide/components.md"];

export function toHtml(file) {
  return file.replace(/\.md$/, ".html");
}
```

:::

@tab Syntax

````markdown
:::offcanvas [Open Panel] left

### Offcanvas

In the `Offcanvas` component, content is wrapped into a panel. Click the trigger button to open or close it.

Markdown syntax is supported inside the panel content.

```javascript
// javascript
const pages = ["index.md", "guide/components.md"];

export function toHtml(file) {
  return file.replace(/\.md$/, ".html");
}
```

:::
````

:::

#### Parameters

- `title`: button text, written as `:::offcanvas [Button Text]`; default is `Open Panel`
- `direction`: panel direction, written as `:::offcanvas [Button Text] direction`; supports `left`, `right`, `top`, and `bottom`, with `right` as the default

## Tree

:::tabs
@tab Demo

:::tree
my-project/
├── src/
│ ├── components/ [collapsed]
│ │ ├── Header.vue
│ │ └── Footer.vue
│ ├── App.vue
│ └── main.js
├── public/
│ └── index.html
├── package.json
└── README.md
:::

@tab Syntax

```markdown
:::tree
my-project/
├── src/
│ ├── components/ [collapsed]
│ │ ├── Header.vue
│ │ └── Footer.vue
│ ├── App.vue
│ └── main.js
├── public/
│ └── index.html
├── package.json
└── README.md
:::
```

:::

#### Config

```javascript
export const docConfig = {
  components: {
    tree: {
      enabled: true,
      fileIcon: true,
    },
  },
};
```

- `components.tree` is disabled by default. Set it to `true` or `{ enabled: true }` to enable it.
- `components.tree.fileIcon` defaults to true. It only applies extension icons to file nodes, and falls back to the `file` icon when no matching icon is registered.
- Add `[collapsed]` after a folder name to make that folder collapsed by default, for example `components/ [collapsed]`.

#### Extend Icons

Use `addIcons()` in `src/runtime/icons.js` to extend file icons.

```javascript
import { addIcons } from "vanilla-jui";
addIcons({
  "align-left": '<path d="M3 4H21V6H3V4ZM3 19H17V21H3V19ZM3 14H21V16H3V14ZM3 9H17V11H3V9Z"></path>',
  "align-right":
    '<path d="M3 4H21V6H3V4ZM7 19H21V21H7V19ZM3 14H21V16H3V14ZM7 9H21V11H7V9Z"></path>',
});
```
