# 菜单

显示在页面顶部的主菜单导航栏。

在 `vp/config/menu.ts` 中，按需配置站点的菜单数据。

当 `vp/config/menu.ts` 导出有效菜单数组时，VanillaPress 会在桌面端和手机端直接构建菜单 HTML；导出空数组时不渲染菜单。

- `label`: 菜单项的国际化语言包的 key
- `path`: 菜单项的页面路径，不需要写 `.html`
- `children`: 子菜单项数组

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
