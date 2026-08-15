# 布局 API

布局用于控制一个 Markdown 页面最终输出的 HTML 外壳。

默认页面使用内置 `default` 布局；当页面需要首页、落地页、专题页等不同结构时，可以在 frontmatter 中通过 `layout` 切换布局。

## 目录约定

每个布局对应一个独立目录，目录名就是布局名。

内置布局由已安装的 `vanilla-press` 依赖包提供。项目侧可以在 `vp/layouts/` 下新增或覆盖布局：

:::tree
vp/
├── layouts/
│ └── landing/
│ │ ├── template.html
│ │ ├── style.css
│ │ └── script.ts
:::

构建时会先读取内置布局，再读取 `vp/layouts/` 中的项目布局。相同名称的项目布局会覆盖内置布局。

布局文件名是固定约定：

- `template.html`：必填。没有该文件时，该目录不会被识别为布局。
- `style.css`：可选。存在时会合并进全站 CSS。
- `script.ts` / `script.js`：可选。存在时会打包为该布局的独立浏览器脚本；同时存在时优先使用 `script.ts`。

## 新增一个布局

创建 `vp/layouts/landing/template.html`，基于 `layout` 对象定义模板变量：

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

创建 `vp/layouts/landing/style.css`：

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

如需为该布局添加浏览器脚本，可以创建 `vp/layouts/landing/script.ts` 或 `vp/layouts/landing/script.js`：

```typescript
export default function initLandingLayout(root: Document, config: unknown) {
  root
    .querySelectorAll('.landing-layout:not([data-layout-ready="true"])')
    .forEach((node) => {
      node.setAttribute('data-layout-ready', 'true');
    });
}
```

布局脚本默认导出函数会在页面运行时调用，参数为 `(document, docConfig)`。布局脚本会被打包为 `dist/public/布局名.hash.js`，只在使用该布局的 HTML 页面中加载。脚本中的静态 npm 依赖会打包进该布局脚本文件，不会进入全局 `runtime.js`。

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

| 变量                      | 说明                               |
| ------------------------- | ---------------------------------- |
| `{{ title }}`             | 当前页面标题，优先使用 SEO 标题    |
| `{{ description }}`       | 当前页面描述，来自 frontmatter     |
| `{{ keywords }}`          | 当前页面关键词，来自 frontmatter   |
| `{{ page.title }}`        | Markdown 页面标题                  |
| `{{ page.rel }}`          | 当前页面输出路径                   |
| `{{ site.siteName }}`     | `vp/config/config.ts` 中的站点配置 |
| `{{ layout.* }}`          | 当前布局作用域下的数据             |
| `{{ layouts.* }}`         | 所有布局作用域数据                 |
| `{{{ content }}}`         | Markdown 渲染后的 HTML             |
| `{{{ slots.header }}}`    | 桌面主菜单和手机主菜单模板         |
| `{{{ slots.secondary }}}` | 手机次级菜单模板                   |
| `{{{ slots.sidebar }}}`   | 默认侧边栏插槽                     |
| `{{{ slots.aside }}}`     | 默认右侧区域插槽，包含目录         |
| `{{{ slots.prevNext }}}`  | 分页导航插槽                       |

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
<header class="doc-header">{{{ slots.header }}} {{{ slots.secondary }}}</header>
<main class="{{ shell.className }}">
  {{{ slots.sidebar }}}
  <section class="{{ shell.mainClassName }}">
    <div data-reveal>
      <article class="j-content is-sm" data-doc-editor>{{{ content }}}</article>
      {{{ slots.prevNext }}}
    </div>
    {{{ slots.aside }}}
  </section>
</main>
<footer class="doc-footer" data-doc-footer></footer>
```

如果新布局仍然是文档页，可以从这个结构复制后调整。`{{{ slots.header }}}` 和 `{{{ slots.secondary }}}` 都应该放在 `.doc-header` 内部，因为运行时会把 `.doc-mobile-header` 和 `.doc-mobile-secondary` 都挂载为 `.doc-header` 的子元素。如果新布局是首页或营销页，通常只在 `.doc-header` 内保留 `{{{ slots.header }}}`，不使用 `{{{ slots.secondary }}}`，然后自行设计页面主体。
