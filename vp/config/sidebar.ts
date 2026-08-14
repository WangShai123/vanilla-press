import type { SidebarConfig } from 'vanilla-press';

export default [
  { label: 'Quick Start', path: 'guide/quick-start' },
  {
    label: 'Layout',
    children: [
      { label: 'API', path: 'guide/layout-api' },
      { label: 'sidebar.homeLayout', path: 'guide/layout-home' },
    ],
  },
  {
    label: 'Components',
    children: [
      { label: 'API', path: 'guide/component-api' },
      { label: 'Components List', path: 'guide/component-list' },
    ],
  },
  {
    label: 'Runtime',
    // collapse: true,
    children: [
      { label: 'Runtime', path: 'guide/runtime' },
      { label: 'sidebar.highlight', path: 'guide/highlight' },
      { label: 'sidebar.locale', path: 'guide/locale' },
      { label: 'sidebar.menu', path: 'guide/menu' },
      { label: 'sidebar.sidebar', path: 'guide/sidebar' },
      { label: 'sidebar.toc', path: 'guide/toc' },
      { label: 'SEO', path: 'guide/seo' },
      { label: 'search.button', path: 'guide/search' },
      { label: 'sidebar.prevNext', path: 'guide/prev-next' },
      { label: 'sidebar.sitemap', path: 'guide/sitemap' },
      { label: 'sidebar.robots', path: 'guide/robots' },
      { label: 'sidebar.llms', path: 'guide/llms' },
      { label: 'theme.button', path: 'guide/theme' },
      { label: 'sidebar.externalLink', path: 'guide/external-link' },
      { label: 'sidebar.inlineScript', path: 'guide/inline-script' },
      { label: 'sidebar.footerScript', path: 'guide/footer-script' },
    ],
  },
  {
    label: 'sidebar.others',
    children: [
      { label: 'sidebar.changelog', path: 'guide/changelog' },
      {
        label: 'Contributors',
        path: 'https://www.jealer.com/contributors/',
        target: '_blank',
      },
    ],
  },
] satisfies SidebarConfig;
