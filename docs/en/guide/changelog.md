# Changelog

## 1.5.x

#### 1.5.11

- feat: Updated layout footer slots and rendered social links after the header search entry.
- fix: external-link scope.

#### 1.5.10

- feat: Added build-time math rendering.

#### 1.5.9

- feat: Added code copy feature.

#### 1.5.8

- feat: Code highlighting now supports line highlights, focus, diff, warnings/errors, and line numbers.

#### 1.5.7

- feat: Search indexes are split by locale path, and pages load the current language data file on demand.
- feat: HTML now receives a `mobile` or `desktop` class during initialization based on device detection.

#### 1.5.6

- feat: `vp-header-doc-nav` is now a layout slot used by the default documentation layout and omitted by the `home` layout.

#### 1.5.5

- feat: Layouts, components, and client entry scripts are now minified during build.

#### 1.5.4

- fix: Fixed client entry builds not reusing shared dependencies.

#### 1.5.3

- feat: client entries.

#### 1.5.2

- feat: Code highlighting replaced from `highlight.js` to `shiki`.
- feat: Client entries now support CSS and can be loaded per page from Markdown frontmatter.
- fix: Removed default template `footer`.

#### 1.5.1

- fix: Fixed toc and other related style issues.

#### 1.5.0

- feat: Reworked the dev server auto-refresh channel to use WebSocket via `ws`.
- feat: Added `docs/` subdirectory `sidebar.ts` support for rendering independent sidebars per directory.

## 1.4.x

#### 1.4.20

- fix: Fixed scaffold process issue

#### 1.4.16-19

- fix: Added valid html tags and attributes

#### 1.4.15

- feat: Added font size control feature
- docs: Updated related documentation

#### 1.4.11

- fix: Optimized development server memory management

#### 1.4.8

- feat: Added timezone marker

#### 1.4.7

- fix: Fixed style issue

#### 1.4.6

- feat: Added edit and last updated time features
- feat: Added Group component
- feat: `vp` directory now includes `cache` directory for caching server results
- feat: Scaffold now automatically adds `.gitignore` file to ignore `vp/cache`, `node_modules`
- refactor: Refactored Badge component
- fix: Runtime configuration is now structured into `runtime` and `client`
- style: All `doc` related names are now prefixed with `vp`
- docs: Updated related documentation

#### 1.4.5

- fix: Fixed dataset marker error

#### 1.4.4

- feat: Added details component

#### 1.4.3

- feat: Added Badge component

#### 1.4.2

- fix: Fixed device mode issue

#### 1.4.1

- fix: Fixed logo link parsing issue in multi-language environment

#### 1.4.0

- feat: Added built-in preview server and auto-refresh feature, default port is 3333

## 1.3.x

#### 1.3.2

- fix: Fixed home title rule
- docs: Updated layout/component/client management documentation.

#### 1.3.1

- docs: Added repo README

#### 1.3.0

- style: Fixed sidebar scrollbar issue

## 1.2.x

#### 1.2.18

- chore: Added `jsdom` dependency

#### 1.2.17

- fix: Fixed type stripping issue.

#### 1.2.16

- refactor: Refactored user project side architecture.

#### 1.2.15

- refactor: Scaffold upgraded from template to project.

#### 1.2.14

- feat: Expanded `external-link` feature coverage, now covering: `data-vp-editor`, `data-vp-menu`, `data-vp-sidebar`

#### 1.2.13

- fix: Removed non-standard robots configuration

#### 1.2.12

- fix: Fixed editor style error caused by dependency updates.

#### 1.2.11

- fix: Fixed theme mode error caused by dependency updates.

#### 1.2.10

- feat: Added client entry support for page-specific scripts declared from Markdown frontmatter.
- feat: Added `footer-script` feature, supporting unified bottom script injection for all pages through `vp/config/footerScript.ts`.
- chore: Updated dependency versions
- fix: Narrowed types based on dependency updates for stricter and more precise type definitions
