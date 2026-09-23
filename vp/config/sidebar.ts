import type { SidebarConfig } from 'vanilla-press'

export default [
  { label: 'Quick Start', path: 'guide/quick-start' },
  {
    label: 'Features',
    children: [
      { label: 'sidebar.layoutApi', path: 'guide/layout-api' },
      { label: 'sidebar.homeLayout', path: 'guide/layout-home' },
      { label: 'Components List', path: 'guide/component-list' },
      { label: 'Runtime', path: 'guide/runtime' },
    ],
  },
] satisfies SidebarConfig
