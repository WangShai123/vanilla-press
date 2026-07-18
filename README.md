# vanilla-press

A lightweight static documentation generator built with `markdown-it` and `vanilla-jui`.

- [README 中文](README_zh.md)

## Overview

`vanilla-press` converts Markdown files under `docs/` into deployable static HTML pages in `dist/`.

It uses a split architecture:

- Build-time rendering for markdown parsing and page generation.
- Runtime enhancement for interactive UI components.

## Installation

```bash
git clone https://github.com/WangShai123/vanilla-press.git
cd vanilla-press
npm install
```

## Build & Development

- `npm run build`: one-time build.
- `npm run dev`: watch mode with automatic rebuild.

## Demo

[Demo Online](http://wangshai123.github.io/vanilla-press)
