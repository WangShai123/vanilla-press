# Quick Start

`vanilla-press` is a static documentation tool built on top of `markdown-it`.

## Features

- Native only: no framework runtime dependency.
- Lightweight: small and simple static output.
- Personalized: easily customize layouts, styles, and components.
- Extensible: container components with runtime enhancement.

## Installation

`npm create` generates the project files, but it does not install dependencies for the new project. After entering the project directory, run `npm install` before starting the dev build.

```bash
npm create vanilla-press@latest vanilla-press
cd vanilla-press
npm install
npm run dev
```

## Build

The build command reads `docs/**/*.md`, outputs pages to `dist/**/*.html` following the same directory structure, and emits related CSS files and JS runtime.

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

## Styling

The runtime separates `desktop` and `mobile` strategies. `vanilla-press` detects the device type and loads the matching runtime behavior and rendering styles.

`vanilla-press` provides the base styles from the installed `vanilla-press` package.

Project-level customization lives in `vp/`, such as custom layouts under `vp/layouts/`.

## Project Structure

- `dist`: output directory that can be deployed directly to any static hosting service.
- `dist/public`: generated static assets, including CSS, JS, favicon, and user assets.
- `assets`: user static assets copied to `dist/public/` during build.
- `docs`: input directory for Markdown pages only.
- `vp/config`: site, locale, menu, sidebar, and related configuration.
- `vp/layouts`: project layouts.
- `vp/components`: project components.
- `package.json`: project scripts and the `vanilla-press` dependency.

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

## Configuration Directory

The project directory is split by responsibility:

- `docs/` contains Markdown documents only.
- `assets/` contains user static assets such as `favicon.ico`.
- `vp/config/` contains `config.ts`, `languages.ts`, `menu.ts`, `sidebar.ts`, `robots.ts`, `llms.ts`, and `footerScript.ts`.
- `vp/layouts/` contains project layouts, replacing the old `docs/_layouts/` location.
- `vp/components/` contains project Markdown components and runtime enhancement code.

Goal: ready to use, easy to move.
