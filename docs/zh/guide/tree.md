# 目录树

帮助用户快速了解文档的目录结构的组件。

## 运行时

在 `docs/config.js` 中，按需配置是否启用目录树组件。

```javascript
export const docConfig = {
  components: {
    tree: true,
  },
};
```

## 示例

:::tabs
@tab 示例

:::tree
my-project/
├── src/
│ ├── components/ [collapsed]
│ │ ├── Header.vue
│ │ └── Footer.vue
│ ├── App.vue
│ └── main.js
├── public/
│ └── index.html
├── package.json
└── README.md
:::

@tab 语法

```markdown
:::tree
my-project/
├── src/
│ ├── components/ [collapsed]
│ │ ├── Header.vue
│ │ └── Footer.vue
│ ├── App.vue
│ └── main.js
├── public/
│ └── index.html
├── package.json
└── README.md
:::
```

:::