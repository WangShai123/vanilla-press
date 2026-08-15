# Quick Start

`vanilla-press` is a lightweight, flexible, and highly customizable static documentation generator.

> Build what you need. Use what you want. Control what you ship.

## Features

- Purely vanilla, no framework lock-in.
- Lightweight, with a small output size.
- Customizable, with support for custom layouts, styles, and components.
- Flexible, with support for custom runtime features.
- Extensible with dependency management, vp-script, and runtime enhancements.

## Installation

```bash
npm create vanilla-press@latest vanilla-press
cd vanilla-press
npm install
npm run dev
```

## Build

The build command reads `docs/**/*.md`, `vp/`, and `assets/`, outputs pages to `dist/**/*.html` following the same directory structure, and emits related CSS files and JS runtime.

:::tabs
@tab Manual Build

```bash
npm run build
```

@tab Watch Build

Use `nodemon` to watch changes under `docs/` and `vp/`, then rebuild automatically.

```bash
npm run dev
```

:::

## Project Structure

- `dist/`: HTML output directory that can be deployed directly to any static hosting service.
- `dist/public/`: generated static assets, including CSS, JS, favicon, images...
- `assets/`: static assets input directory.
- `docs/`: input directory for Markdown pages only.
- `vp/config/`: site and runtime configuration.
- `vp/layouts/`: custom layouts.
- `vp/components/`: custom components.

:::tree
vanilla-press/
├── dist/
│ └── public/
├── assets/
│ └── favicon.ico
├── docs/
├── vp/
│ ├── config/
│ ├── layouts/
│ └── components/
├── package.json
└── README.md
:::

## Styling

The runtime separates `desktop` and `mobile` strategies. `vanilla-press` detects the device type and loads the matching runtime behavior and rendering styles.
