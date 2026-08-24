# Changelog

## 1.2.x

#### 1.2.10

- feat: Added `vp-script` feature, supporting the use of `vp-script` in Markdown to write page-specific scripts.
- feat: Added `footer-script` feature, supporting unified bottom script injection for all pages through `vp/config/footerScript.ts`.
- chore: Updated dependency versions
- fix: Narrowed types based on dependency updates for stricter and more precise type definitions

#### 1.2.11

- fix: Fixed theme mode error caused by dependency updates.

#### 1.2.12

- fix: Fixed editor style error caused by dependency updates.

#### 1.2.13

- fix: Removed non-standard robots configuration

#### 1.2.14

- feat: Expanded `external-link` feature coverage, now covering: `data-vp-editor`, `data-vp-menu`, `data-vp-sidebar`

#### 1.2.15

- refactor: Scaffold upgraded from template to project.

#### 1.2.16

- refactor: Refactored user project side architecture.

#### 1.2.17

- fix: Fixed type stripping issue.

#### 1.2.18

- chore: Added `jsdom` dependency

## 1.3.x

#### 1.3.0

- style: Fixed sidebar scrollbar issue

#### 1.3.1

- docs: Added repo README

#### 1.3.2

- fix: Fixed home title rule
- docs: Updated layout/component/vp-script documentation.

## 1.4.x

#### 1.4.0

- feat: Added built-in preview server and auto-refresh feature, default port is 3333

#### 1.4.1

- fix: Fixed logo link parsing issue in multi-language environment

#### 1.4.2

- fix: Fixed device mode issue

#### 1.4.3

- feat: Added Badge component

#### 1.4.4

- feat: Added details component

#### 1.4.5

- fix: Fixed dataset marker error

#### 1.4.6

- feat: Added edit and last updated time features
- feat: Added Group component
- feat: `vp` directory now includes `cache` directory for caching build results
- feat: Scaffold now automatically adds `.gitignore` file to ignore `vp/cache`, `node_modules`
- refactor: Refactored Badge component
- fix: Runtime configuration is now structured into `runtime` and `browser`
- style: All `doc` related names are now prefixed with `vp`
- docs: Updated related documentation

#### 1.4.7

- fix: Fixed style issue

#### 1.4.8

- feat: Added timezone marker

#### 1.4.11

- fix: Optimized development server memory management

#### 1.4.15

- feat: Added font size control feature
- docs: Updated related documentation

#### 1.4.16-19

- fix: Added valid html tags and attributes

#### 1.4.20

- fix: Fixed scaffold process issue
