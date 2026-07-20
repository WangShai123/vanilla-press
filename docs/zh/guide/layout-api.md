# 布局 API

布局用于控制一个 Markdown 页面最终输出的 HTML 外壳。

默认页面使用内置 `default` 布局；当页面需要首页、落地页、专题页等不同结构时，可以在 frontmatter 中通过 `layout` 切换布局。

## 目录约定

每个布局对应一个独立目录，目录名就是布局名。

:::tree
src/layouts/
├── default/
│ ├── template.html
│ └── style.css
└── home/
├── template.html
└── style.css
:::

项目文档侧也可以新增或覆盖布局：

:::tree
docs/layouts/
└── landing/
├── template.html
└── style.css
:::

构建时会先读取 `src/layouts/` 中的内置布局，再读取 `docs/layouts/` 中的项目布局。相同名称的项目布局会覆盖内置布局。

## 新增一个布局

创建 `docs/layouts/landing/template.html`，基于 `layout` 对象定义模板变量：

```html
<main class="landing-layout">
  <section class="landing-hero">
    <p>{{ layout.hero.badge }}</p>
    <h1>{{ layout.hero.title }}</h1>
    <p>{{ layout.hero.description }}</p>
  </section>

  <article class="j-content is-sm">{{{ content }}}</article>
</main>
```

创建 `docs/layouts/landing/style.css`：

```css
.landing-layout {
  width: min(1080px, calc(100% - 32px));
  margin: 0 auto;
  padding: 48px 0;
}

.landing-hero {
  padding: 32px;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: var(--ui-surface-raised);
}
```

然后在 Markdown 页面中使用它：

```markdown
---
layout: landing
title: 产品介绍
layouts:
  landing:
    hero:
      badge: Release
      title: 新版本发布
      description: 用一个自定义布局展示产品发布内容。
---

# 正文内容

这里的 Markdown 会渲染到模板的 `{{{ content }}}` 插槽中。
```

## 模板变量

布局模板可以读取构建器注入的上下文。

| 变量                     | 说明                             |
| ------------------------ | -------------------------------- |
| `{{ title }}`            | 当前页面标题，优先使用 SEO 标题  |
| `{{ description }}`      | 当前页面描述，来自 frontmatter   |
| `{{ keywords }}`         | 当前页面关键词，来自 frontmatter |
| `{{ page.title }}`       | Markdown 页面标题                |
| `{{ page.rel }}`         | 当前页面输出路径                 |
| `{{ site.siteName }}`    | `docs/config.js` 中的站点配置    |
| `{{ layout.* }}`         | 当前布局作用域下的数据           |
| `{{ layouts.* }}`        | 所有布局作用域数据               |
| `{{{ content }}}`        | Markdown 渲染后的 HTML           |
| `{{{ slots.header }}}`   | 桌面主菜单和手机主菜单模板       |
| `{{{ slots.secondary }}}` | 手机次级菜单模板                 |
| `{{{ slots.sidebar }}}`  | 默认侧边栏插槽                   |
| `{{{ slots.aside }}}`    | 默认右侧区域插槽，包含目录       |
| `{{{ slots.prevNext }}}` | 分页导航插槽                     |

普通双花括号会进行 HTML 转义，适合输出 frontmatter 中的文本。

三花括号不会转义，只用于构建器生成的可信 HTML 插槽，例如 `content`、`slots.header`、`slots.secondary`、`slots.sidebar`、`slots.aside` 和 `slots.prevNext`。

## 数组循环

模板支持简单数组循环：

```html
<div class="actions">
  {{#layout.hero.actions}}
  <a href="{{ link }}" class="{{ variant }}">{{ text }}</a>
  {{/layout.hero.actions}}
</div>
```

对应 frontmatter：

```yaml
layouts:
  landing:
    hero:
      actions:
        - text: 快速开始
          link: ./guide/quick-start.html
          variant: is-primary
        - text: 查看 API
          link: ./guide/api.html
          variant: is-secondary
```

循环中的对象字段会提升到当前作用域，因此模板里可以直接写 `{{ text }}`、`{{ link }}`。如果数组项是字符串，可以使用 `{{ this }}` 输出当前项。

## 布局变量作用域

推荐把布局专用变量写到 `layouts.<layoutName>` 下：

```yaml
layout: landing
layouts:
  landing:
    hero:
      title: 自定义标题
```

当页面选择 `layout: landing` 时，模板中的 `{{ layout.hero.title }}` 会读取 `layouts.landing.hero.title`。这样可以避免多个布局之间的变量互相冲突。

## 分页导航插槽

`runtime.prevNext` 只会渲染到当前布局显式声明的插槽中：

```html
<div data-doc-prev-next></div>
```

默认文档布局已经包含该插槽。自定义布局如果不需要分页导航，可以不写这个插槽；如果需要，放在希望出现分页导航的位置即可。

## 默认布局参考

内置 `default` 布局复用文档站常规结构：左侧侧边栏、正文、右侧目录和页脚。它的模板核心结构如下：

```html
<header class="doc-header">
{{{ slots.header }}}
{{{ slots.secondary }}}
</header>
<main class="{{ shell.className }}">
  {{{ slots.sidebar }}}
  <section class="{{ shell.mainClassName }}">
    <div>
      <article class="j-content is-sm">{{{ content }}}</article>
      {{{ slots.prevNext }}}
    </div>
    {{{ slots.aside }}}
  </section>
</main>
<footer class="doc-footer" data-doc-footer></footer>
```

如果新布局仍然是文档页，可以从这个结构复制后调整。`{{{ slots.header }}}` 和 `{{{ slots.secondary }}}` 都应该放在 `.doc-header` 内部，因为运行时会把 `.doc-mobile-header` 和 `.doc-mobile-secondary` 都挂载为 `.doc-header` 的子元素。如果新布局是首页或营销页，通常只在 `.doc-header` 内保留 `{{{ slots.header }}}`，不使用 `{{{ slots.secondary }}}`，然后自行设计页面主体。
