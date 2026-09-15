# Sidebar

The sidebar navigation displayed along the side of the page.

In `vp/config/sidebar.ts`, configure the site's global sidebar data as needed.

When `vp/config/sidebar.ts` or a directory-level `sidebar.ts` exports a valid sidebar array, VanillaPress builds the desktop and mobile sidebar HTML directly for matching pages. Export an empty array to render no sidebar.

- `label`: i18n message key for the sidebar item
- `path`: page path for the sidebar item, without `.html`
- `children`: array of second-level sidebar items
- `collapse`: whether the group is collapsed by default when `children` is present

```ts
export default [
  { label: 'sidebar.home', path: 'index' },
  {
    label: 'sidebar.config',
    collapse: true,
    children: [
      { label: 'sidebar.runtime', path: 'guide/runtime' },
      { label: 'sidebar.locale', path: 'guide/locale' },
      { label: 'sidebar.menu', path: 'guide/menu' },
      { label: 'sidebar.sidebar', path: 'guide/sidebar' },
    ],
  },
]
```

## Directory Sidebar

Since `1.5.0`, a subdirectory under `docs/` can add its own `sidebar.ts` or `sidebar.js` to replace the global sidebar for all pages in that directory.

For example, `docs/components/sidebar.ts` applies to pages under `docs/components/**`, and uses the same format as `vp/config/sidebar.ts`:

```ts
import type { SidebarConfig } from 'vanilla-press'

export default [
  { label: 'components.overview', path: 'components/index' },
  { label: 'components.button', path: 'components/button' },
] satisfies SidebarConfig
```

When multiple directory sidebars match the current page, the nearest directory wins. Once a directory sidebar matches, the global sidebar is not rendered for that page.

## Initialization

The sidebar initializes differently based on the user's device type:

- Desktop: the sidebar is shown on the left side of the page by default.
- Mobile: the sidebar is rendered as a secondary menu under the top navigation bar.
