---
title: Home
keywords: vanilla-press, markdown-it, static docs
description: Vanilla-Press is a lightweight static documentation generator built with markdown-it and vanilla-jui.
---

# Introduction

`vanilla-press` is a static documentation tool built on top of `markdown-it`.

## Highlights

- Native only: no framework runtime dependency.
- Lightweight: small and simple static output.
- Extensible: container components with runtime enhancement.

## Installation

:::tabs
@tab git

```bash
git clone https://github.com/WangShai123/vanilla-press.git
cd vanilla-press
npm install
```

@tab npm

```bash
npm create vanilla-press@latest vanilla-press
cd vanilla-press
npm install
```

:::

You can also run the same initializer directly from the root package:

```bash
npx vanilla-press@latest init vanilla-press
cd vanilla-press
npm install
```

## Build

The build command reads `docs/**/*.md`, outputs pages to `dist/**/*.html` following the same directory structure, and emits one shared CSS file plus one shared JS runtime.

:::tabs
@tab Manual Build

```bash
npm run build
```

@tab Watch Build

Use `nodemon` to watch changes under `docs/` and rebuild automatically.

```bash
npm run dev
```

:::

## Preview

[Online Preview](http://wangshai123.github.io/vanilla-press)

## Styling

`vanilla-press` only ships base styles. Override `style.css` in your project as needed.

The runtime separates `desktop` and `mobile` strategies. `VanillaPress` detects the device type and loads the matching runtime behavior and rendering styles.

## Project Structure

- `dist`: output directory that can be deployed directly to any static hosting service.
- `docs`: input directory containing Markdown pages and site configuration.
- `src`: source directory containing the runtime, renderer, components, and utilities.

:::tree
vanilla-press/
├── dist/
├── docs/
├── src/
│ ├── components/
│ ├── config/
│ ├── core/
│ ├── render/
│ ├── runtime/
│ ├── utilities/
│ ├── build.js
│ ├── runtime.js
│ └── style.css
├── package.json
└── README.md
:::

## Built-in Runtime Features

- Menu
- Code highlighting
- Pagination
- Internationalization
- Table of contents
- SEO
- Search
- Theme

## Built-in Components

- accordion
- offcanvas
- tabs
- tree
