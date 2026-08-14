# vanilla-press

A lightweight, elegant, and highly customizable static documentation generator built on `markdown-it`.

## Features

- Purely vanilla JavaScript, no runtime dependencies.
- Lightweight, with a small output size.
- Customizable layouts, styles, and components.
- Extensible with container components and runtime-time enhancements.

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
