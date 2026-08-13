# Quick Start

`vanilla-press` is a static documentation tool built on top of `markdown-it`.

## Features

- Native only: no framework runtime dependency.
- Lightweight: small and simple static output.
- Personalized: easily customize layouts, styles, and components.
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

## Styling

The runtime separates `desktop` and `mobile` strategies. `vanilla-press` detects the device type and loads the matching runtime behavior and rendering styles.

`vanilla-press` provides only basic styles, with the style `preset source` set in `src/config/externalStyle.ts`.

You can 100% customize the styles by overriding `style.css` and changing the `preset source` in `src/config/externalStyle.ts`.

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
│ ├── build.ts
│ ├── runtime.ts
│ └── style.ts
├── package.json
└── README.md
:::

## Configuration Directory

All custom configuration lives under the `docs/` directory:

- Configuration files
- Custom layouts and styles
- Custom components and styles

Goal: ready to use, easy to move.
