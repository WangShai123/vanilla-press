# 组件

`vanilla-press` 组件是基于 `vanilla-jui` 的一套 Markdown 容器组件，主要用于文档页面排版与交互增强。

## Tabs

内置组件，默认启用。

:::tabs
@tab JavaScript

```javascript
// javascript
const pages = ["index.md", "guide/components.md"];

export function toHtml(file) {
  return file.replace(/\.md$/, ".html");
}
```

@tab HTML

```html
<article class="j-content is-sm">
  <h1>组件示例</h1>
  <p>主体内容使用 vanilla-jui 排版类。</p>
</article>
```

@tab 语法

```markdown
:::tabs
@tab 选项一

内容一

@tab 选项二

内容二

:::
```

:::

## Accordion

内置组件，默认启用。

:::tabs
@tab 示例

:::accordion multiple collapsible
@item 支持目录结构

`docs/zh/guide/components.md` 会输出为 `dist/zh/guide/components.html`，资源链接会自动计算相对路径。

@item 支持代码高亮

代码块会保留 `language-*` class，并写入基础 token 高亮样式。

@item 支持页面级组件初始化

每个 HTML 会自动写入自己的 `initDocPage({ components: [...] })` 脚本。
:::

@tab 语法

```markdown
:::accordion multiple collapsible
@item 支持目录结构

`docs/zh/guide/components.md` 会输出为 `dist/zh/guide/components.html`，资源链接会自动计算相对路径。

@item 支持代码高亮

代码块会保留 `language-*` class，并写入基础 token 高亮样式。

@item 支持页面级组件初始化

每个 HTML 会自动写入自己的 `initDocPage({ components: [...] })` 脚本。
:::
```

:::

#### 参数说明

- `multiple` 是否允许同时展开多个面板，不写即为 false
- `collapsible` 是否允许折叠所有面板，不写即为 false

## Offcanvas

内置组件，默认启用。

:::tabs
@tab 示例

:::offcanvas [打开面板] left

### Offcanvas

在 `Offcanvas` 组件中，内容会被包裹在一个面板容器中，点击按钮可以打开或关闭面板。

面板容器内支持 `Markdown` 语法。

```javascript
// javascript
const pages = ["index.md", "guide/components.md"];

export function toHtml(file) {
  return file.replace(/\.md$/, ".html");
}
```

:::

@tab 语法

````markdown
:::offcanvas [打开面板] left

### Offcanvas

在 `Offcanvas` 组件中，内容会被包裹在一个面板容器中，点击按钮可以打开或关闭面板。

面板容器内支持 `Markdown` 语法。

```javascript
// javascript
const pages = ["index.md", "guide/components.md"];

export function toHtml(file) {
  return file.replace(/\.md$/, ".html");
}
```

:::
````

:::

#### 参数说明

- `title` 按钮文本，写法 `:::offcanvas [按钮文本]`，默认值 `打开面板`
- `direction` 面板方向，写法 `:::offcanvas [按钮文本] direction`，支持 `left`、`right`、`top`、`bottom`，默认值 `right`

## Tree

内置组件，需要手动启用。

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

#### 配置

```javascript
export const docConfig = {
  components: {
    tree: {
      enabled: true,
      fileIcon: true,
    },
  },
};
```

- `components.tree` 默认关闭，设置为 `true` 或 `{ enabled: true }` 后启用。
- `components.tree.fileIcon` 默认开启，仅对文件节点查找后缀图标，未注册时回退为 `file` 图标。
- 在文件夹名称后添加 `[collapsed]` 可以设置该文件夹默认收起，例如 `components/ [collapsed]`。

#### 扩展图标

在 `src/runtime/icons.js` 中，使用 `addIcons()` 方法扩展文件图标。

```javascript
import { addIcons } from "vanilla-jui";
addIcons({
  "align-left": '<path d="M3 4H21V6H3V4ZM3 19H17V21H3V19ZM3 14H21V16H3V14ZM3 9H17V11H3V9Z"></path>',
  "align-right":
    '<path d="M3 4H21V6H3V4ZM7 19H21V21H7V19ZM3 14H21V16H3V14ZM7 9H21V11H7V9Z"></path>',
});
```
