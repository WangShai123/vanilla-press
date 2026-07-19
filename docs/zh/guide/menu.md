# 菜单

显示在页面顶部的主菜单导航栏。

## 运行时

在 `docs/config.js` 中，按需配置是否启用主菜单功能。

```javascript
export const docConfig = {
  runtime: {
    menu: true,
  },
};
```

## 配置

在 `docs/menu.js` 中，按需配置站点的菜单数据。

- `label`: 菜单项的国际化语言包的 key
- `path`: 菜单项的页面路径，不需要写 `.html`
- `children`: 子菜单项数组

```javascript
export const menuItems = [
  { label: "menu.home", path: "index" },
  {
    label: "menu.guide",
    children: [
      { label: "menu.components", path: "guide/components" },
      { label: "menu.api", path: "guide/api" },
    ],
  },
];
```

`path` 为空时不会生成链接地址，可用于只展开子菜单的父项。
