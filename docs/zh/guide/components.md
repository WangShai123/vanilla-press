# 组件

`vanilla-press` 组件是基于 `vanilla-jui` 的一套 Markdown 容器组件，主要用于文档页面排版与交互增强。

## Highlight

基于 `highlight.js` 的代码高亮，支持多种语言。

```javascript
// javascript
const pages = ["index.md", "guide/components.md"];

export function toHtml(file) {
  return file.replace(/\.md$/, ".html");
}
```

## Tabs

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

:::offcanvas [打开抽屉] left

### Offcanvas

在 `Offcanvas` 组件中，内容会被包裹在一个抽屉容器中，点击按钮可以打开或关闭抽屉。

抽屉容器内支持 `Markdown` 语法。

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
:::offcanvas [打开抽屉] left

### Offcanvas

在 `Offcanvas` 组件中，内容会被包裹在一个抽屉容器中，点击按钮可以打开或关闭抽屉。

抽屉容器内支持 `Markdown` 语法。

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
- `direction` 抽屉方向，写法 `:::offcanvas [按钮文本] direction`，支持 `left`、`right`、`top`、`bottom`，默认值 `right`

组件设计规范与开发 API 见 [组件开发 API](./api.html)。
