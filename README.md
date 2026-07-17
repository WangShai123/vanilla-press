# vanilla-press

A lightweight static documentation generator built with `markdown-it` and `vanilla-jui`.

## Overview

`vanilla-press` converts Markdown files under `docs/` into deployable static HTML pages in `dist/`.
It uses a split architecture:

- Build-time rendering for markdown parsing and page generation.
- Runtime enhancement for interactive UI components.

## v1.0.0 Components

Version `1.0.0` includes the following built-in components:

- `highlight`
- `tabs`
- `accordion`
- `offcanvas`

## Key Design Features

- Component initialization by dependency graph (topological order).
- Multi-pass runtime initialization to support nested components.
- Dynamic DOM re-initialization for component trees created after first render.
- Configurable i18n switch, default locale, and default-locale URL redirect.

## Project Structure

- `docs/`: source docs and site configuration (`config.js`, `menu.js`, `sidebar.js`, `languages.js`).
- `src/`: build pipeline and runtime/component implementation.
- `dist/`: generated static site output.

## Build & Development

```bash
npm install
npm run build
npm run dev
```

- `npm run build`: one-time build.
- `npm run dev`: watch mode with automatic rebuild.

## Multilingual Docs

Current language folders:

- `docs/zh/`: Chinese docs.
- `docs/en/`: English docs.

When i18n is enabled, runtime applies locale-aware navigation and locale switching behavior.

If `redirectToDefault` is enabled, root access is redirected to the configured default locale entry.
