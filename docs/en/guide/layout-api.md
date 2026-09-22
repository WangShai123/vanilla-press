# Layout API

Layouts control the final HTML shell generated for a Markdown page.

Pages use the built-in `default` layout by default. When a page needs a different structure, such as a homepage, landing page, or topic page, switch layouts with `layout` in frontmatter.

## Directory Convention

Each layout has its own directory, and the directory name is the layout name.

Built-in layouts are shipped by the installed `vanilla-press` package. Project documentation can add or override layouts under `vp/layouts/`:

:::tree
vp/
├── layouts/
│ └── landing/
│ │ ├── template.html
│ │ ├── style.css
│ │ └── script.ts
:::

During build, VanillaPress reads built-in layouts first, then reads project layouts from `vp/layouts/`. A project layout with the same name overrides the built-in layout.

Layout file names are fixed conventions:

- `template.html`: required. Without this file, the directory is not recognized as a layout.
- `style.css`: optional. When present, it is merged into the site-wide CSS.
- `script.ts` / `script.js`: optional. When present, it is bundled as an independent client script for the layout. If both files exist, `script.ts` takes priority.

## Add a Layout

Create `vp/layouts/landing/template.html`, and define template variables from the `layout` object:

```html
<main class="landing-layout">
  <section class="landing-hero">
    <p>{{ layout.hero.badge }}</p>
    <h1>{{ layout.hero.title }}</h1>
    <p>{{ layout.hero.description }}</p>
  </section>

  <article class="j-editor is-sm">{{{ content }}}</article>
</main>
```

Create `vp/layouts/landing/style.css`:

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

To add client behavior for the layout, create `vp/layouts/landing/script.ts` or `vp/layouts/landing/script.js`:

```typescript
export default function initLandingLayout(root: Document, config: unknown) {
  root
    .querySelectorAll('.landing-layout:not([data-layout-ready="true"])')
    .forEach((node) => {
      node.setAttribute('data-layout-ready', 'true')
    })
}
```

The default exported function is called at page runtime with `(document, runtimeConfig)`. The layout script is bundled as `dist/public/layout-name.hash.js` and loaded only by HTML pages that use that layout. Static npm imports used by the script reuse `server.client.shared` and the default whitelist: matched dependencies are bundled into the global `runtime.js`, while unmatched dependencies stay bundled into the layout script file. Layout scripts can also reuse project-owned browser code from `vp/client` through `vanilla-press/client` and `vanilla-press/client/modules/*`.

Then use it in a Markdown page:

```markdown
---
layout: landing
title: Product Introduction
layouts:
  landing:
    hero:
      badge: Release
      title: New Version Released
      description: Use a custom layout to present product release content.
---

# Page Content

This Markdown content will render into the `{{{ content }}}` slot in the template.
```

## Template Variables

Layout templates can read the context injected by the builder.

| Variable                      | Description                                                        |
| ----------------------------- | ------------------------------------------------------------------ |
| `{{ title }}`                 | Current page title, preferring the SEO title                       |
| `{{ description }}`           | Current page description from frontmatter                          |
| `{{ keywords }}`              | Current page keywords from frontmatter                             |
| `{{ page.title }}`            | Markdown page title                                                |
| `{{ page.rel }}`              | Current page output path                                           |
| `{{ site.siteName }}`         | Site config from `vp/config/runtime.ts`                            |
| `{{ layout.* }}`              | Data scoped to the current layout                                  |
| `{{ layouts.* }}`             | Data for all layout scopes                                         |
| `{{{ content }}}`             | HTML rendered from Markdown                                        |
| `{{{ editorHelp }}}`          | Editor help block, including edit link and last edit time          |
| `{{{ slots.header }}}`        | Responsive site header with site name, main menu, and actions      |
| `{{{ slots.headerDocNav }}}`  | Compact documentation navigation slot with sidebar and TOC buttons |
| `{{{ slots.sidebar }}}`       | Default sidebar slot                                               |
| `{{{ slots.mobileSidebar }}}` | Mobile sidebar drawer content slot                                 |
| `{{{ slots.aside }}}`         | Default right-side region slot, including the table of contents    |
| `{{{ slots.prevNext }}}`      | Previous/next navigation slot                                      |

Double braces perform HTML escaping and are suitable for text from frontmatter.

Triple braces do not escape HTML. Use them only for trusted HTML generated by the builder, such as `content`, `editorHelp`, `slots.header`, `slots.headerDocNav`, `slots.sidebar`, `slots.mobileSidebar`, `slots.aside`, and `slots.prevNext`.

## Array Loops

Templates support simple array loops:

```html
<div class="actions">
  {{#layout.hero.actions}}
  <a href="{{ link }}" class="{{ variant }}">{{ text }}</a>
  {{/layout.hero.actions}}
</div>
```

Matching frontmatter:

```yaml
layouts:
  landing:
    hero:
      actions:
        - text: Quick Start
          link: ./guide/quick-start.html
          variant: is-solid
        - text: View API
          link: ./guide/api.html
          variant: is-soft
```

Object fields inside a loop are promoted into the current scope, so templates can use `{{ text }}` and `{{ link }}` directly. If an array item is a string, use `{{ this }}` to output the current item.

## Layout Variable Scope

Put layout-specific variables under `layouts.<layoutName>`:

```yaml
layout: landing
layouts:
  landing:
    hero:
      title: Custom title
```

When a page selects `layout: landing`, `{{ layout.hero.title }}` reads `layouts.landing.hero.title`. This avoids variable conflicts between different layouts.

## Previous/Next Slot

`server.prevNext` only renders into a slot explicitly declared by the current layout:

```html
<div data-vp-prev-next></div>
```

The default documentation layout already includes this slot. If a custom layout does not need previous/next navigation, omit the slot. If it needs it, place the slot where the navigation should appear.

## Default Layout Reference

The built-in `default` layout reuses the common documentation structure: left sidebar, content, right-side table of contents, and footer. Its core template structure is:

```html
<header class="vp-header">
  {{{ slots.header }}} {{{ slots.headerDocNav }}}
</header>
{{{ slots.mobileSidebar }}}
<main class="{{ shell.className }}">
  {{{ slots.sidebar }}}
  <section class="{{ shell.mainClassName }}">
    <div class="vp-content" data-reveal>
      <div class="vp-content-wrap">
        <article class="{{ shell.editorClassName }}" data-vp-editor>
          {{{ content }}}
        </article>
        {{{ editorHelp }}}
      </div>
      {{{ slots.prevNext }}}
    </div>
    {{{ slots.aside }}}
  </section>
</main>
```

If the new layout is still a documentation page, copy and adjust this structure. Keep `{{{ slots.header }}}` and `{{{ slots.headerDocNav }}}` inside `.vp-header`, and place `{{{ slots.mobileSidebar }}}` after the header so the compact sidebar drawer has content. If the new layout is a homepage or marketing page, usually keep only `{{{ slots.header }}}` and design the page body yourself.
