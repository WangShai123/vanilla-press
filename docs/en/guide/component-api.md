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
      `<span class="doc-badge" data-doc-component="badge">${escapeHtml(tokens[index].content)}</span>`;
  },
  init(root) {
    root
      .querySelectorAll(
        '[data-doc-component="badge"]:not([data-doc-ready="true"])'
      )
      .forEach((node) => {
        node.setAttribute('data-doc-ready', 'true');
      });
  },
} satisfies MarkdownComponentDefinition;
```

## Markdown Usage

```markdown
:::badge Stable
```

The build-time `install` function registers Markdown syntax and calls `markComponent(env, name)` when the component appears on a page. The runtime `init` function is optional. If it exists, it is bundled as `dist/public/component-name.hash.js` and loaded only by HTML pages that used the component.

Static npm imports used by the component `init` code are bundled into that component script. They are not bundled into the global `runtime.js`.

## Runtime Rules

- The rendered root element must include `data-doc-component="<name>"`.
- Runtime code must only scan inside the provided `root`.
- Runtime code must skip elements already marked with `data-doc-ready="true"`.
- After initialization, mark the element with `data-doc-ready="true"`.
- Use `dependsOn` when a component needs another component initialized first.

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

The browser runtime merges built-in components with project components, expands dependencies, initializes in dependency order, and repeats until no pending component nodes remain. It also watches dynamically inserted DOM and initializes new `data-doc-component` nodes automatically.

Project component scripts are page-scoped: each page dynamically imports only the `dist/public/component-name.hash.js` files required by the project components used on that page. If a component declares `dependsOn` and the dependency is also a project component, the dependency script is loaded as well.
