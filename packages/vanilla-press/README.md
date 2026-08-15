# vanilla-press

A lightweight, flexible, and highly customizable static documentation generator.

> Build what you need. Use what you want. Control what you ship.

[中文](README_zh.md)

## Features

- Purely vanilla, no framework lock-in.
- Lightweight, with a small output size.
- Customizable, with support for custom layouts, styles, and components.
- Flexible, with support for custom runtime features.
- Extensible with dependency management, vp-script, and runtime enhancements.

## Installation

```bash
npm create vanilla-press@latest my-docs
cd my-docs
npm install
npm run dev
```

## Build

- `npm run build`: one-time build.
- `npm run dev`: watch mode with automatic rebuild.

`vanilla-press` reads source files from `docs/` and writes the generated site to `dist/`.

## Directory Structure

- `dist/`: Document output directory, deployable to static hosting services.
- `dist/public/`: Built static assets directory, containing CSS, JS, favicon, and user assets.
- `assets/`: User static assets directory, copied to dist/public/ during build.
- `docs/`: Document input directory, only place Markdown pages here.
- `vp/config.js`: Site configuration, multi-language, menu, sidebar, etc.
- `vp/layouts/`: User custom layouts directory.
- `vp/components/`: User custom components directory.
- `package.json`: Project dependencies configuration.
