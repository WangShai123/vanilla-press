# Home Layout

`home` is the homepage layout example provided by VanillaPress. It shows how to drive a freer page structure from frontmatter. It reuses the shared site header, while the page body is controlled by `src/layouts/home/template.html` and `src/layouts/home/style.css`.

## Enable It

Declare the layout in page frontmatter:

```yaml
layout: home
```

Homepage files are usually placed at `index.md` inside each language directory, for example:

```text
docs/zh/index.md
docs/en/index.md
```

## Complete Example

```yaml
---
layout: home
title: Home
keywords: vanilla-press, markdown-it, static docs
description: VanillaPress is a lightweight static documentation generator built with markdown-it and vanilla-jui.
layouts:
  home:
    hero:
      badge: vanilla press
      title: Lightweight, elegant static documentation generator
      description: A markdown-it based static documentation scaffold that loads features and components on demand and keeps the generated JavaScript runtime small.
      hint: Built-in multilingual support, search, SEO, theme modes, and other common documentation features.
      actions:
        - text: Quick Start
          link: ./guide/quick-start.html
          variant: is-primary
        - text: View Components
          link: ./guide/components.html
          variant: is-secondary
    quickStart:
      title: Quick Start
      groups:
        - title: Create with NPM
          lines:
            - npm create vanilla-press@latest my-docs
            - cd my-docs
            - npm install
            - npm run dev
    features:
      title: Why VanillaPress
      description: Keep static deployment simple while adding the runtime enhancements a documentation site needs.
      items:
        - index: 1
          title: Native Runtime
          description: No React or Vue runtime binding. The output stays simple and works well for low-dependency documentation projects.
    cta:
      title: Start customizing from the home layout
      description: This page is generated with layout: home and layouts.home variables, and can be used as a reference for custom layout templates.
      actions:
        - text: Read the Guide
          link: ./guide/quick-start.html
          variant: is-primary
---
```

All variables for the `home` layout are placed under `layouts.home`. Inside the template, values are read with expressions such as `{{ layout.hero.title }}` and `{{ layout.features.title }}`.

## Hero Area

`hero` controls the left side of the homepage first screen.

| Field         | Description                       |
| ------------- | --------------------------------- |
| `badge`       | Small label above the heading     |
| `title`       | Main homepage heading             |
| `description` | Supporting text under the heading |
| `hint`        | Extra note under the buttons      |
| `actions`     | Button list for the first screen  |

Common fields in `actions`:

| Field     | Description                                                                      |
| --------- | -------------------------------------------------------------------------------- |
| `text`    | Button text                                                                      |
| `link`    | Button link                                                                      |
| `variant` | Button style class. The current example supports `is-primary` and `is-secondary` |

## Quick Start Area

`quickStart` controls the code card on the right side of the first screen.

```yaml
quickStart:
  title: Quick Start
  groups:
    - title: Create with NPM
      lines:
        - npm create vanilla-press@latest my-docs
        - cd my-docs
        - npm install
        - npm run dev
```

Each `groups` item renders as a command group. `lines` is an array of strings, and the template outputs each line into the code block.

## Features Area

`features` controls the card list in the middle of the homepage.

```yaml
features:
  title: Why VanillaPress
  description: Keep static deployment simple while adding the runtime enhancements a documentation site needs.
  items:
    - index: 1
      title: Native Runtime
      description: No React or Vue runtime binding. The output stays simple.
```

Each item in `items` renders as a card. `index` is used as the card number in the upper-left corner, and can also be replaced with short text.

## CTA Area

`cta` controls the action area near the bottom of the homepage.

```yaml
cta:
  title: Start customizing from the home layout
  description: This page is generated with layout: home and layouts.home variables.
  actions:
    - text: Read the Guide
      link: ./guide/quick-start.html
      variant: is-primary
```

## Markdown Content

The `home` template still keeps a `{{{ content }}}` slot, but `.doc-home-content` is hidden by default. This lets the page keep a small amount of Markdown content for the search index, SEO, or later template reuse.

If you want the homepage to show Markdown content, override the `home` layout style:

```css
.doc-home-content {
  display: block;
}
```

## Difference from the Default Layout

The `home` layout does not use the default documentation sidebar, right-side table of contents, or previous/next navigation. Even if `runtime.prevNext` is enabled in `docs/config.js`, the homepage will not render previous/next navigation because the `home` template does not declare a `<div data-doc-prev-next></div>` slot.

If you copy `home` into a new landing-page layout and want to show previous/next navigation, add the slot manually:

```html
<div data-doc-prev-next></div>
```

## Custom Styles

The built-in `home` styles include background light effects, glass cards, button motion, code cards, feature card hover effects, and a CTA gradient. You can copy `src/layouts/home/` to `docs/layouts/home/` and customize it for your project:

:::tree
docs/layouts/home/
├── template.html
└── style.css
:::

A project layout with the same name overrides the built-in layout, which is useful for customizing the homepage without modifying generator source code.
