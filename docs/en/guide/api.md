# Component Development API

This document is for component maintainers and explains the runtime model, conventions, and extension points of the `vanilla-press` component system.

## Design Features

### 1. Build-time and runtime separation

- Build-time: `markdown-it` converts container syntax into HTML with stable `data-*` markers.
- Runtime: `initDocPage()` scans the page and wires up interactive behavior.
- Benefit: output is fully static and deployable, while runtime logic stays minimal.

### 2. Dependency-graph initialization (topological order)

Runtime components declare dependencies in a registry and are initialized in topological order instead of hardcoded sequence.

- Typical dependency: `accordion` and `offcanvas` depend on `tabs`.
- Result: container components are built first, then nested components inside them are initialized.

### 3. Multi-pass convergence initialization

Initialization does not run once only. It runs in ordered passes until no new pending component nodes remain.

- Useful for chained cases where initializing component A creates DOM for component B.
- Every component initializer must be idempotent.

### 4. Auto re-init on dynamic DOM insertion

Runtime observes DOM insertions and reruns initialization when new `data-doc-component` nodes appear.

- Covers tabs panel rebuilds, async insertion, and future lazy-loaded components.

## Design Rules

- Every component container starts with `:::component-name` and must end with a standalone `:::` line.
- When nesting components inside `:::tabs`, child components must stay fully inside an `@tab` panel.
- Parameter parsing uses a unified rule: bracket text for titles, whitespace tokens for boolean/enum options.
- Component renderer output must include `data-doc-component`, and initializer must mark `data-doc-ready="true"` after setup.
- For any new component, provide all three parts: Markdown parser/renderer, runtime initializer, and docs with demo + syntax + parameter notes.

## Component API

### 1. Component module contract

Each component should live in `src/components/<name>.js` and export two core functions:

- `install<Name>(md)`: register Markdown block parsing and renderer rules.
- `init<Name>(root = document)`: scan and initialize matching nodes at runtime.

Recommended skeleton:

```javascript
export function installXxx(md) {
  // register block rule
  // register renderer rule
}

export function initXxx(root = document) {
  // query by data-doc-component
  // skip nodes with data-doc-ready=true
  // bind events / build widget
  // mark data-doc-ready=true
}
```

### 2. Markdown parsing utilities

Reusable helpers in `src/components/utils.js`:

- `readContainer(state, startLine, endLine)`: parse `:::` containers with nested blocks and fenced code support.
- `parseBracketTitle(info)`: parse bracket title text, e.g. `[Open Drawer]`.
- `parseFlag(info, name)`: parse boolean flag tokens such as `multiple` and `collapsible`.
- `splitMarkedBlocks(content, marker, fallbackTitle)`: split content by markers like `@tab` or `@item`.
- `markComponent(env, name)`: collect used component names for runtime injection.

### 3. HTML output contract

Renderer output should follow these rules:

- Root element must contain `data-doc-component="<name>"`.
- Child elements should use stable `data-*` hooks for runtime querying.
- Parsed options should be serialized into `data-*` attributes to avoid re-parsing markdown at runtime.

Example:

```html
<div data-doc-component="accordion" data-multiple="true">
  <div data-doc-accordion-item data-title="Panel Title">...</div>
</div>
```

### 4. Runtime initialization API

`initDocPage(options)` runtime flow:

- Read component names injected at build time.
- Expand dependencies from registry.
- Execute initialization in topological order.
- Repeat passes until convergence.
- Observe dynamic insertions and re-run incrementally.

Component authors only need to keep `init<Name>` idempotent and root-scoped.

### 5. Idempotence and safety boundaries

Each `init<Name>` must:

- Support repeated invocation safely.
- Operate only within the provided `root` scope.
- Exit safely if required child nodes are missing.

## New Component Checklist

1. Create `src/components/<name>.js` with `install<Name>` and `init<Name>`.
2. Register `install<Name>` in Markdown creator.
3. Register runtime initializer and dependencies in runtime registry.
4. Add docs page content: demo, syntax, and parameter notes.

## Nesting Recommendations

- Tabs containing accordion/offcanvas: declare `dependsOn: ["tabs"]`.
- Accordion containing tabs: no special branch required if initializers are idempotent.
- Async inserted content: ensure inserted roots include `data-doc-component` so runtime can auto-initialize them.
