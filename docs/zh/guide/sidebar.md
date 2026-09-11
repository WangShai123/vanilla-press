# 侧边栏

显示在页面侧面的侧边栏导航。

## 运行时

在 `vp/config/runtime.ts` 中，按需配置是否启用侧边栏功能。

```ts
export default {
  browser: {
    sidebar: true,
  },
}
```

## 配置

在 `vp/config/sidebar.ts` 中，按需配置站点的全局侧边栏数据。

- `label`: 侧边栏项的国际化语言包的 key
- `path`: 侧边栏项的页面路径，不需要写 `.html`
- `children`: 二级侧边栏项数组
- `collapse`: 包含 `children` 时是否默认收起

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

## 目录级侧边栏

从 `1.5.0` 开始，`docs/` 下的子目录可以新增自己的 `sidebar.ts` 或 `sidebar.js`，用于覆盖该目录下所有页面的全局侧边栏。

例如 `docs/components/sidebar.ts` 会作用于 `docs/components/**` 下的页面，且格式与 `vp/config/sidebar.ts` 完全一致：

```ts
import type { SidebarConfig } from 'vanilla-press'

export default [
  { label: 'components.overview', path: 'components/index' },
  { label: 'components.button', path: 'components/button' },
] satisfies SidebarConfig
```

如果多个目录级侧边栏同时匹配当前页面，会使用最靠近当前页面的那一份配置。目录级侧边栏命中后，不会再渲染全局侧边栏。

## 初始化

侧边栏会根据用户设备（桌面端或手机端）决定初始化方式：

- 桌面端：侧边栏会默认显示在页面左侧。
- 手机端：侧边栏以次级菜单的形式显示在顶部导航栏下方。
