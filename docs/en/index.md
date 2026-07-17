# Introduction

`vanilla-press` is a static documentation tool built on top of `markdown-it`.

## Highlights

- Native only: no framework runtime dependency.
- Lightweight: small and simple static output.
- Extensible: container components with runtime enhancement.

## Installation

```bash
git clone https://github.com/WangShai123/vanilla-press.git
cd vanilla-press
npm install
```

## Demo

[Online Demo](http://wangshai123.github.io/vanilla-press)

## Usage

- `docs`: source directory for Markdown pages and site config.
- `dist`: build output directory for deployment.

## Build

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

The build command reads `docs/**/*.md`, outputs pages to `dist/**/*.html`, and emits one shared CSS bundle and one shared JS runtime.

## Styling

`vanilla-press` ships only base styles, and you can override them as needed.

The default layout strategy separates `desktop` and `mobile` experiences. The runtime picks a matching layout and initializes related components automatically.
