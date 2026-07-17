# Components

`vanilla-press` components are a set of Markdown container components built on top of `vanilla-jui` for document layout and interactions.

## Highlight

Code highlighting powered by `highlight.js`, with support for multiple languages.

```javascript
// javascript
const pages = ["index.md", "guide/components.md"];

export function toHtml(file) {
  return file.replace(/\.md$/, ".html");
}
```

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

- `multiple`: allow multiple panels to be expanded at the same time; default is false
- `collapsible`: allow all panels to be collapsed; default is false

## Offcanvas

:::tabs
@tab Demo

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

- `title`: trigger text, syntax `:::offcanvas [Button Text]`, default is `Open Panel`
- `direction`: panel direction, syntax `:::offcanvas [Button Text] direction`, supports `left`, `right`, `top`, `bottom`, default is `right`

For design rules and development API, see [Component Development API](./api.html).
