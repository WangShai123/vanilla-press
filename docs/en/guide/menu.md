# Menu

The main navigation menu displayed at the top of the page.

In `vp/config/menu.ts`, configure the site's menu data as needed.

When `vp/config/menu.ts` exports a valid menu array, VanillaPress builds the menu HTML directly for both desktop and mobile. Export an empty array to render no menu.

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
