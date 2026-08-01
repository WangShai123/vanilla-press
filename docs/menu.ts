import type { MenuConfig } from '../src/types.ts';

export default [
  { label: 'menu.home', path: 'index' },
  {
    label: 'menu.guide',
    children: [
      { label: 'menu.components', path: 'guide/components' },
      { label: 'API', path: 'guide/api' },
    ],
  },
] satisfies MenuConfig;
