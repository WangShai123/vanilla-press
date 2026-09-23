# Quick Start

`vanilla-press` is a lightweight, flexible, and highly customizable static documentation generator.

> Build what you need. Use what you want. Control what you ship.

## Features

- Purely vanilla, no framework lock-in.
- Lightweight, with a small output size.
- Customizable, with support for custom layouts, styles, and components.
- Flexible, with support for custom runtime features.
- Extensible with dependency management, client entries, and runtime enhancements.

## Installation

```bash
npm create vanilla-press@latest vanilla-press
cd vanilla-press
npm install
npm run dev
```

## Build

The build command reads `docs/**/*.md`, `vp/`, and `assets/`, outputs pages to `dist/**/*.html` following the same directory structure, and emits related CSS files and JS runtime. Site configuration lives in `vp/config/runtime.ts`, with build-stage data under `server` and browser runtime data under `client`.

:::tabs
@tab Manual Build

```bash
npm run server
```

@tab Preview

Start the local preview server. Changes under `docs/`, `vp/`, and `assets/` rebuild the site and refresh the client automatically.

```bash
npm run dev
```

:::

## Project Structure

- `dist/`: HTML output directory that can be deployed directly to any static hosting service.
- `dist/public/`: generated static assets, including CSS, JS, favicon, images...
- `assets/`: static assets input directory.
- `docs/`: input directory for Markdown pages only.
- `vp/client/`: project-owned browser runtime code, modules, and page entries.
- `vp/components/`: custom components.
- `vp/config/`: site configuration directory.
- `vp/layouts/`: custom layouts.

:::tree
vanilla-press/
├── dist/
│ └── public/
├── assets/
│ └── favicon.ico
├── docs/
├── vp/
│ ├── client/
│ ├── components/
│ ├── config/
│ └── layouts/
├── package.json
└── README.md
:::

## Styling

The runtime uses a responsive layout strategy. CSS media queries switch desktop and compact styles, while JavaScript only binds the interactions needed by the rendered DOM.
