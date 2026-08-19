# Menu

The main navigation menu displayed at the top of the page.

## Runtime

In `vp/config/runtime.ts`, configure whether the main menu is enabled.

```ts
export default {
  browser: {
    menu: true,
  },
}
```

## Configuration

In `vp/config/menu.ts`, configure the site's menu data as needed.

- `label`: i18n message key for the menu item
- `path`: page path for the menu item, without `.html`
- `children`: array of submenu items

```ts
export default [
  { label: 'menu.home', path: 'index' },
  {
    label: 'menu.guide',
    children: [
      { label: 'menu.components', path: 'guide/components' },
      { label: 'menu.api', path: 'guide/api' },
    ],
  },
]
```
