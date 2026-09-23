import type { MenuConfig } from 'vanilla-press'

export default [
  { label: 'Home', path: 'index' },
  {
    label: 'Guide',
    children: [
      { label: 'Quick Start', path: 'guide/quick-start' },
      { label: 'Layout', path: 'guide/layout-api' },
      { label: 'Components', path: 'guide/component-list' },
      { label: 'Runtime', path: 'guide/runtime' },
    ],
  },
  {
    label: 'Documentation',
    path: 'https://app.jealer.com/',
    target: '_blank',
  },
] satisfies MenuConfig
