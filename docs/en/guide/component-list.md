# Components

`vanilla-press` builtin components are a set of Markdown container components built on top of `vanilla-jui` for document layout and interactions.

## Tabs

:::tabs
@tab JavaScript

```javascript
const pages = ['index.md', 'guide/components.md'];

export function toHtml(file) {
  return file.replace(/\.md$/, '.html');
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
const pages = ['index.md', 'guide/components.md'];

export function toHtml(file) {
  return file.replace(/\.md$/, '.html');
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
const pages = ['index.md', 'guide/components.md'];

export function toHtml(file) {
  return file.replace(/\.md$/, '.html');
}
```

:::
````

:::

#### Parameters

- `title`: button text, written as `:::offcanvas [Button Text]`; default is `Open Panel`
- `direction`: panel direction, written as `:::offcanvas [Button Text] direction`; supports `left`, `right`, `top`, and `bottom`, with `right` as the default

## Tip

:::tabs
@tab Demo

:::tip
This is a tip message.
:::

::: success Success
The operation has completed.
:::

::: warning Warning
Please confirm the configuration.
:::

::: danger Danger
This action cannot be undone.
:::

@tab Syntax

```markdown
:::tip
This is a tip message.
:::

::: info Custom title
This is a tip message.
:::

::: success Success
The operation has completed.
:::

::: warning Warning
Please confirm the configuration.
:::

::: danger Danger
This action cannot be undone.
:::
```

:::

#### Parameters

- `:::tip` is syntax sugar for `::: info`, and outputs `is-default`.
- `info`, `success`, `warning`, and `danger` map to `is-default`, `is-success`, `is-warning`, and `is-danger`.
- When no title is provided, Chinese pages show `提示` and English pages show `Tip`.

## Tree

A component that helps users quickly understand the directory structure of the documentation.

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
├── tests/
│ └── app.test.ts
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
├── tests/
│ └── app.test.ts
├── package.json
└── README.md
:::
```

:::

#### Notes

- File nodes resolve icons by extension and fall back to the `file` icon when no matching icon is registered.
- Add `[collapsed]` after a folder name to make that folder collapsed by default, for example `components/ [collapsed]`.

#### Extend Icons

Add or remove svg icons as needed in `src/config/icons.ts`.

```javascript
export default {
  'align-left':
    '<path d="M3 4H21V6H3V4ZM3 19H17V21H3V19ZM3 14H21V16H3V14ZM3 9H17V11H3V9Z"></path>',
  'align-right':
    '<path d="M3 4H21V6H3V4ZM7 19H21V21H7V19ZM3 14H21V16H3V14ZM7 9H21V11H7V9Z"></path>',
  copy: '<path d="M20 8v12H8V8zm0-2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2"></path><path d="M4 16H2V4a2 2 0 0 1 2-2h12v2H4Z"></path>',
};
```

## Badge

:::tabs
@tab Demo

<p class="flex-container">

::: badge
1.0
:::

::: badge reverse
1.0
:::

::: badge primary
1.0
:::

::: badge success
1.0
:::

::: badge warning
1.0
:::

::: badge danger
1.0
:::

::: badge error
1.0
:::
</p>

<div class="flex-container">

::: badge default sm
1.0
:::

::: badge reverse sm
1.0
:::

::: badge primary sm
1.0
:::

::: badge success sm
1.0
:::

::: badge warning sm
1.0
:::

::: badge danger sm
1.0
:::

::: badge error sm
1.0
:::
</div>

@tab Syntax

```markdown
::: badge [theme] [size]
text
:::
```

:::

`theme` default `default`，optional：`reverse`、`primary`、`success`、`warning`、`danger`、`error`

`size` default `md`，optional：`sm`、`lg`

## Details

:::tabs
@tab Demo

::: details Title
This is a details panel.
:::

@tab Syntax

```markdown
::: details Title
This is a details panel.
:::
```

:::
