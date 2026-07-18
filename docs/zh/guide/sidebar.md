# 侧边栏

显示在页面侧面的侧边栏导航。

## 运行时

在 `docs/config.js` 中，按需配置是否启用侧边栏功能。

```javascript
export const docConfig = {
  sidebar: true,
};
```

## 配置

在 `docs/sidebar.js` 中，按需配置站点的侧边栏数据。

- `label`: 侧边栏项的国际化语言包的 key
- `path`: 侧边栏项的页面路径，不需要写 `.html`
- `children`: 二级侧边栏项数组
- `collapse`: 包含 `children` 时是否默认收起

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

`path` 为空时不会生成链接地址，适合作为只负责展开/收起的分组标题。

## 初始化

侧边栏会根据用户设备（桌面端或手机端）决定初始化方式：

- 桌面端：侧边栏会默认显示在页面左侧。
- 手机端：侧边栏以次级菜单的形式显示在顶部导航栏下方。
