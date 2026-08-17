# 组件

`vanilla-press` 内置组件是基于 `vanilla-jui` 的一套 Markdown 容器组件，主要用于文档页面排版与交互增强。

## Tabs

:::tabs
@tab JavaScript

```javascript
const pages = ['index.md', 'guide/components.md'];

export function toHtml(file) {
  return file.replace(/\.md$/, '.html');
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

:::tabs
@tab 示例

:::offcanvas [打开面板] left

### Offcanvas

在 `Offcanvas` 组件中，内容会被包裹在一个面板容器中，点击按钮可以打开或关闭面板。

面板容器内支持 `Markdown` 语法。

```javascript
// javascript
const pages = ['index.md', 'guide/components.md'];

export function toHtml(file) {
  return file.replace(/\.md$/, '.html');
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
const pages = ['index.md', 'guide/components.md'];

export function toHtml(file) {
  return file.replace(/\.md$/, '.html');
}
```

:::
````

:::

#### 参数说明

- `title` 按钮文本，写法 `:::offcanvas [按钮文本]`，默认值 `打开面板`
- `direction` 面板方向，写法 `:::offcanvas [按钮文本] direction`，支持 `left`、`right`、`top`、`bottom`，默认值 `right`

## Tip

:::tabs
@tab 示例

:::tip
这是一个提示信息。
:::

::: success 成功
操作已完成。
:::

::: warning 注意
请确认配置内容。
:::

::: danger 危险
删除后不可恢复。
:::

@tab 语法

```markdown
:::tip
这是一个提示信息。
:::

::: info 自定义标题
这是一个提示信息。
:::

::: success 成功
操作已完成。
:::

::: warning 注意
请确认配置内容。
:::

::: danger 危险
删除后不可恢复。
:::
```

:::

#### 参数说明

- `:::tip` 是 `::: info` 的语法糖，输出 `is-default`。
- `info`、`success`、`warning`、`danger` 分别对应 `is-default`、`is-success`、`is-warning`、`is-danger`。
- 不传标题时，中文页面默认显示 `提示`，英文页面默认显示 `Tip`。

## Tree

帮助用户快速了解文档的目录结构的组件。

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
├── tests/
│ └── app.test.ts
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
├── tests/
│ └── app.test.ts
├── package.json
└── README.md
:::
```

:::

#### 说明

- 文件节点会按后缀查找图标，未注册时回退为 `file` 图标。
- 在文件夹名称后添加 `[collapsed]` 可以设置该文件夹默认收起，例如 `components/ [collapsed]`。

#### 扩展图标

在 `src/config/icons.ts` 中，按需增减 svg 图标的配置。

```javascript
export default {
  'align-left':
    '<path d="M3 4H21V6H3V4ZM3 19H17V21H3V19ZM3 14H21V16H3V14ZM3 9H17V11H3V9Z"></path>',
  'align-right':
    '<path d="M3 4H21V6H3V4ZM7 19H21V21H7V19ZM3 14H21V16H3V14ZM7 9H21V11H7V9Z"></path>',
  copy: '<path d="M20 8v12H8V8zm0-2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2"></path><path d="M4 16H2V4a2 2 0 0 1 2-2h12v2H4Z"></path>',
};
```

## Badge

:::tabs
@tab 示例

<p class="flex-container">

::: badge
1.0
:::

::: badge reverse
1.0
:::

::: badge primary
1.0
:::

::: badge success
1.0
:::

::: badge warning
1.0
:::

::: badge danger
1.0
:::

::: badge error
1.0
:::
</p>

<div class="flex-container">

::: badge default sm
1.0
:::

::: badge reverse sm
1.0
:::

::: badge primary sm
1.0
:::

::: badge success sm
1.0
:::

::: badge warning sm
1.0
:::

::: badge danger sm
1.0
:::

::: badge error sm
1.0
:::
</div>

@tab 语法

```markdown
::: badge [theme] [size]
text
:::
```

:::

`theme` 默认值 `default`，可选：`reverse`、`primary`、`success`、`warning`、`danger`、`error`

`size` 默认值 `md`，可选：`sm`、`lg`
