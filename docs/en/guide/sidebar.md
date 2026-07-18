# Sidebar

The sidebar navigation displayed along the side of the page.

## Runtime

In `docs/config.js`, configure whether the sidebar is enabled.

```javascript
export const docConfig = {
  sidebar: true,
};
```

## Configuration

In `docs/sidebar.js`, configure the site's sidebar data as needed.

- `label`: i18n message key for the sidebar item
- `path`: page path for the sidebar item, without `.html`
- `children`: array of second-level sidebar items
- `collapse`: whether the group is collapsed by default when `children` is present

```javascript
export const sidebarItems = [
  { label: "sidebar.home", path: "index" },
  {
    label: "sidebar.config",
    collapse: true,
    children: [
      { label: "sidebar.runtime", path: "guide/runtime" },
      { label: "sidebar.locale", path: "guide/locale" },
      { label: "sidebar.menu", path: "guide/menu" },
      { label: "sidebar.sidebar", path: "guide/sidebar" },
    ],
  },
];
```

When `path` is empty, no link is generated. This works well for group labels that only expand or collapse child items.

## Initialization

The sidebar initializes differently based on the user's device type:

- Desktop: the sidebar is shown on the left side of the page by default.
- Mobile: the sidebar is rendered as a secondary menu under the top navigation bar.
