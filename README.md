# create-vanilla-press

A lightweight npm create scaffold for vanilla-press, built from the existing documentation project template.

- [README 中文](README_zh.md)

## Overview

`create-vanilla-press` scaffolds a vanilla-press project that converts Markdown files under `docs/` into deployable static HTML pages in `dist/`.

It uses a split architecture:

- Build-time rendering for markdown parsing and page generation.
- Runtime enhancement for interactive UI components.

## Features

- Native only: no framework runtime dependency.
- Lightweight: small and simple static output.
- Personalized: easily customize layouts, styles, and components.
- Extensible: container components with runtime enhancement.

## Installation

Git:

```bash
git clone https://github.com/WangShai123/vanilla-press.git
cd vanilla-press
npm install
```

NPM:

```bash
npm create vanilla-press@latest vanilla-press
cd vanilla-press
npm install
```

## Build & Development

- `npm run build`: one-time build.
- `npm run dev`: watch mode with automatic rebuild.

## Demo

[Demo Online](https://vanilla-press.jealer.com)
