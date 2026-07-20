# Tree

A component that helps users quickly understand the directory structure of the documentation.

## Runtime

In `docs/config.js`, configure whether the tree component is enabled.

```javascript
export const docConfig = {
  components: {
    tree: true,
  },
};
```

## Example

:::tabs
@tab Demo

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

@tab Syntax

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
