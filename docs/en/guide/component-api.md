# Component API

Project components live in `vp/components/`. They are loaded during build and can also provide runtime enhancement code. Runtime code is bundled as independent component scripts instead of being merged into `runtime.js`.

## Directory

Each component can be a single file or a directory with `index.ts`:

:::tree
vp/
├── components/
│ ├── badge.ts
│ └── callout/
│ │ └── index.ts
:::

VanillaPress loads `vp/components/*.ts`, `vp/components/*.js`, `vp/components/*/index.ts`, and `vp/components/*/index.js`.

## Component Contract

A component module exports a component object:

```typescript
import type { MarkdownComponentDefinition } from 'vanilla-press';

export default {
  name: 'badge',
  install(md, { markComponent, escapeHtml }) {
    md.block.ruler.before(
      'paragraph',
      'badge',
      (state, startLine, endLine, silent) => {
        const start = state.bMarks[startLine];
        const end = state.eMarks[startLine];
        const line = state.src.slice(start, end).trim();
        if (!line.startsWith(':::badge')) return false;
        if (silent) return true;

        const content = line.replace(/^:::badge/, '').trim();
        const token = state.push('badge', 'span', 0);
        token.content = content;
        markComponent(state.env, 'badge');
        state.line = startLine + 1;
        return true;
      }
    );

    md.renderer.rules.badge = (tokens, index) =>
      `<span class="doc-badge" data-vp-component="badge">${escapeHtml(tokens[index].content)}</span>`;
  },
  init(root) {
    root
      .querySelectorAll(
        '[data-vp-component="badge"]:not([data-vp-ready="true"])'
      )
      .forEach((node) => {
        node.setAttribute('data-vp-ready', 'true');
      });
  },
} satisfies MarkdownComponentDefinition;
```

Named exports are also supported. VanillaPress resolves component modules in this order:

```typescript
// Option 1: default component object
export default {
  name: 'badge',
  install() {},
  init() {},
} satisfies MarkdownComponentDefinition;

// Option 2: exported component object
export const component = {
  name: 'badge',
  install() {},
  init() {},
} satisfies MarkdownComponentDefinition;

// Option 3: named component fields
export const name = 'badge';
export const dependsOn = ['tabs'];
export function install(md, context) {}
export function init(root, config) {}
```

Component names must match `/^[A-Za-z][\w-]*$/` and must be unique within `vp/components/`.

## Markdown Usage

```markdown
:::badge Stable
```

The build-time `install` function registers Markdown syntax and calls `markComponent(env, name)` when the component appears on a page. The runtime `init` function is optional. If it exists, it is bundled as `dist/public/component-name.hash.js` and loaded only by HTML pages that used the component.

Static npm imports used by the component `init` code are bundled into that component script. They are not bundled into the global `runtime.js`.

If a component does not provide `init`, it only participates in Markdown rendering and does not generate a browser script.

## Runtime Rules

- The rendered root element must include `data-vp-component="<name>"`.
- `init(root, config)` receives the current document root and the site config.
- Runtime code must only scan inside the provided `root` and should not globally mutate unrelated nodes.
- Runtime code must skip elements already marked with `data-vp-ready="true"`.
- After initialization, mark the element with `data-vp-ready="true"`.
- Use `dependsOn` when a component needs another component initialized first.
- If a component module provides `init`, that same module is bundled for the browser. Keep top-level code and top-level static imports browser-compatible.

Example with dependency:

```typescript
export default {
  name: 'panel-tabs',
  dependsOn: ['tabs'],
  install(md, context) {
    // Register Markdown syntax.
  },
  init(root) {
    // Runs after tabs.
  },
} satisfies MarkdownComponentDefinition;
```

## Initialization Model

The browser runtime merges built-in components with project components, expands dependencies, initializes in dependency order, and repeats until no pending component nodes remain. It also watches dynamically inserted DOM and initializes new `data-vp-component` nodes automatically.

Project component scripts are page-scoped: each page dynamically imports only the `dist/public/component-name.hash.js` files required by the project components used on that page. If a component declares `dependsOn` and the dependency is also a project component, the dependency script is loaded as well.
