# 首页布局

`home` 是 VanillaPress 提供的首页布局示例，用于展示如何通过 frontmatter 驱动一个更自由的页面结构。它复用站点通用 header，但页面主体由 `src/layouts/home/template.html` 和 `src/layouts/home/style.css` 控制。

## 启用方式

在页面 frontmatter 中声明：

```yaml
layout: home
```

通常首页文件会放在语言目录的 `index.md` 中，例如：

```text
docs/zh/index.md
docs/en/index.md
```

## 完整示例

```yaml
---
layout: home
title: 首页
keywords: vanilla-press, markdown-it, 静态文档
description: VanillaPress 是基于 markdown-it 和 vanilla-jui 的轻量静态文档生成器。
layouts:
  home:
    hero:
      badge: vanilla press
      title: 轻量、优雅的静态文档生成器
      description: 基于 `markdown-it` 的静态文档脚手架，按需引用功能和组件，最小化构建 JavaScript 运行时。
      hint: 内置多语言、搜索、SEO、主题模式等常用功能。
      actions:
        - text: 快速开始
          link: ./guide/quick-start.html
          variant: is-primary
        - text: 查看组件
          link: ./guide/components.html
          variant: is-secondary
    quickStart:
      title: 快速开始
      groups:
        - title: NPM 创建
          lines:
            - npm create vanilla-press@latest my-docs
            - cd my-docs
            - npm install
            - npm run dev
    features:
      title: 为什么选择 VanillaPress
      description: 保留静态部署的简单性，提供必要的运行时增强。
      items:
        - index: 1
          title: 原生运行时
          description: 不绑定 React 或 Vue，页面输出简单，适合低依赖、易部署的文档项目。
    cta:
      title: 从首页布局开始定制
      description: 当前页面使用 layout: home 和 layouts.home 变量生成，可作为自定义布局模板的参考。
      actions:
        - text: 阅读指南
          link: ./guide/quick-start.html
          variant: is-primary
---
```

`home` 布局的变量全部放在 `layouts.home` 下。模板内部通过 `{{ layout.hero.title }}`、`{{ layout.features.title }}` 这类写法读取当前布局变量。

## Hero 区域

`hero` 控制首页首屏左侧内容。

| 字段          | 说明               |
| ------------- | ------------------ |
| `badge`       | 标题上方的小标签   |
| `title`       | 首页主标题         |
| `description` | 主标题下方的说明   |
| `hint`        | 按钮下方的补充说明 |
| `actions`     | 首屏按钮列表       |

`actions` 中常用字段：

| 字段      | 说明                                                    |
| --------- | ------------------------------------------------------- |
| `text`    | 按钮文字                                                |
| `link`    | 按钮链接                                                |
| `variant` | 按钮样式类，当前示例支持 `is-primary` 和 `is-secondary` |

## 快速开始区域

`quickStart` 控制首屏右侧代码卡片。

```yaml
quickStart:
  title: 快速开始
  groups:
    - title: NPM 创建
      lines:
        - npm create vanilla-press@latest my-docs
        - cd my-docs
        - npm install
        - npm run dev
```

每个 `groups` 项会渲染为一个命令分组。`lines` 是字符串数组，模板会逐行输出到代码块中。

## 特性区域

`features` 控制首页中段的卡片列表。

```yaml
features:
  title: 为什么选择 VanillaPress
  description: 保留静态部署的简单性，提供必要的运行时增强。
  items:
    - index: 1
      title: 原生运行时
      description: 不绑定 React 或 Vue，页面输出简单。
```

`items` 中的每一项会渲染为一张卡片。`index` 用于卡片左上角的编号，也可以换成短文本。

## CTA 区域

`cta` 控制首页底部行动区。

```yaml
cta:
  title: 从首页布局开始定制
  description: 当前页面使用 layout: home 和 layouts.home 变量生成。
  actions:
    - text: 阅读指南
      link: ./guide/quick-start.html
      variant: is-primary
```

## Markdown 正文

`home` 模板仍然保留了 `{{{ content }}}` 插槽，但默认样式中隐藏了 `.doc-home-content`。这样页面仍可以保留少量 Markdown 正文，供搜索索引、SEO 或后续自定义模板复用。

如果你希望首页显示 Markdown 正文，可以覆盖 `home` 布局样式：

```css
.doc-home-content {
  display: block;
}
```

## 与默认布局的区别

`home` 布局不使用默认文档页的侧边栏、右侧目录和分页导航。即使 `docs/config.js` 中开启了 `runtime.prevNext`，首页也不会渲染分页导航，因为 `home` 模板没有声明 `<div data-doc-prev-next></div>` 插槽。

如果你基于 `home` 复制出一个新的落地页布局，并希望显示分页导航，可以在模板中手动加入：

```html
<div data-doc-prev-next></div>
```

## 自定义样式

内置 `home` 样式包含背景光效、玻璃卡片、按钮动效、代码卡片、特性卡片 hover 效果和 CTA 渐变。你可以复制 `src/layouts/home/` 到 `docs/layouts/home/` 后按项目需要修改：

:::tree
docs/layouts/home/
├── template.html
└── style.css
:::

项目侧同名布局会覆盖内置布局，适合在不修改生成器源码的情况下定制首页。
