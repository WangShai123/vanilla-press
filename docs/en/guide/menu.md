# Menu

The main navigation menu displayed at the top of the page.

## Runtime

In `vp/config/config.ts`, configure whether the main menu is enabled.

```javascript
export default {
  runtime: {
    menu: true,
  },
};
```

## Configuration

In `vp/config/menu.ts`, configure the site's menu data as needed.

- `label`: i18n message key for the menu item
- `path`: page path for the menu item, without `.html`
- `children`: array of submenu items

```javascript
export default [
  { label: 'menu.home', path: 'index' },
  {
    label: 'menu.guide',
    children: [
      { label: 'menu.components', path: 'guide/components' },
      { label: 'menu.api', path: 'guide/api' },
    ],
  },
];
```

When `path` is empty, no link is generated.
