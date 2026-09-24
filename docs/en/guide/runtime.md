---
keywords: Runtime, code highlight, math formulas, vanilla-press
description: Introduce Vanilla Press runtime features, including code highlighting, math formulas, etc.
---

# Runtime

## Highlight

Highlight is powered by `Shiki` and prerendered to static HTML during build.

:::tabs
@tab 示例

```rust
use std::future::Future;

async fn map_concurrent<T, U, F, Fut>(items: Vec<T>, f: F) -> Vec<U>
where
    F: Fn(T) -> Fut,
    Fut: Future<Output = U>,
{
    futures::future::join_all(items.into_iter().map(f)).await
}
```

@tab 语法

````markdown
```rust
use std::future::Future;

async fn map_concurrent<T, U, F, Fut>(items: Vec<T>, f: F) -> Vec<U>
where
    F: Fn(T) -> Fut,
    Fut: Future<Output = U>,
{
    futures::future::join_all(items.into_iter().map(f)).await
}
```
````

:::

### Highlight Lines

Add `{lines}` after the code block language to highlight specific lines. Single lines, multiple lines, and ranges are supported.

:::tabs
@tab Example

```ts {2,4-6}
const name = 'VanillaPress'
const version = '1.5'

export function info() {
  return `${name}@${version}`
}
```

@tab Syntax

````markdown
```ts {2,4-6}
const name = 'VanillaPress'
const version = '1.5'

export function info() {
  return `${name}@${version}`
}
```
````

:::

You can also use `[!code highlight]`. When it is placed at the end of a code line, it targets the current line. When it is placed on its own comment line, it targets the next line. The marker is removed during build and does not appear in the final HTML.

:::tabs
@tab Example

```ts
const name = 'VanillaPress'
const version = '1.5' // [!code highlight]

export function info() {
  // [!code highlight:3]
  return `${name}@${version}`
}
```

@tab Syntax

````markdown
```ts
const name = 'VanillaPress'
const version = '1.5' // [!code highlight]

export function info() {
  // [!code highlight:3]
  return `${name}@${version}`
}
```
````

:::

`[!code highlight:3]` highlights three lines starting from the target line.

### Focus Code

Use `[!code focus]` to emphasize key lines and dim the rest of the same code block.

:::tabs
@tab Example

```ts
const name = 'VanillaPress'
const version = '1.5' // [!code focus]

export function info() {
  return `${name}@${version}` // [!code focus]
}
```

@tab Syntax

````markdown
```ts
const name = 'VanillaPress'
const version = '1.5' // [!code focus]

export function info() {
  return `${name}@${version}` // [!code focus]
}
```
````

:::

Continuous ranges are supported too:

:::tabs
@tab Example

```ts
export function createApp() {
  // [!code focus:3]
  const app = {}
  return app
}
```

@tab Syntax

````markdown
```ts
export function createApp() {
  // [!code focus:3]
  const app = {}
  return app
}
```
````

:::

### Color Differences

Use `[!code ++]` and `[!code --]` to mark added and removed lines. This is useful for showing before/after changes inside a code block.

:::tabs
@tab Example

```ts
const theme = 'github-light-default'
const darkTheme = 'github-dark-default' // [!code --]
const darkTheme = 'github-dark-high-contrast' // [!code ++]
```

@tab Syntax

````markdown
```ts
const theme = 'github-light-default'
const darkTheme = 'github-dark-default' // [!code --]
const darkTheme = 'github-dark-high-contrast' // [!code ++]
```
````

:::

### Errors and Warnings

Use `[!code warning]` and `[!code error]` to mark warning or error lines.

:::tabs
@tab Example

```ts
function loadTheme(theme?: string) {
  if (!theme) return 'github-light-default' // [!code warning]
  if (theme === 'unknown') throw new Error('Invalid theme') // [!code error]

  return theme
}
```

@tab Syntax

````markdown
```ts
function loadTheme(theme?: string) {
  if (!theme) return 'github-light-default' // [!code warning]
  if (theme === 'unknown') throw new Error('Invalid theme') // [!code error]

  return theme
}
```
````

:::

### Line Numbers

Add `line-numbers` after the code block language to show line numbers.

:::tabs
@tab Example

```ts line-numbers
export const siteName = 'VanillaPress'
export const version = '1.5'
```

@tab Syntax

````markdown
```ts line-numbers
export const siteName = 'VanillaPress'
export const version = '1.5'
```
````

:::

You can also set the starting line number:

:::tabs
@tab Example

```ts line-numbers=10
export function mount() {
  return true
}
```

@tab Syntax

````markdown
```ts line-numbers=10
export function mount() {
  return true
}
```
````

:::

## Math

Use `mathjax3` to prerender math in Markdown to static SVG during build.

### Inline Math

Wrap inline math with single `$` delimiters.

:::tabs
@tab Example

Euler's identity is $e^{i\pi}+1=0$.

@tab Syntax

```markdown
Euler's identity is $e^{i\pi}+1=0$.
```

:::

### Block Math

Wrap display math with `$$` delimiters.

:::tabs
@tab Example

$$
\nabla \cdot \vec{\mathbf{E}} = 4 \pi \rho
$$

@tab Syntax

```markdown
$$
\nabla \cdot \vec{\mathbf{E}} = 4 \pi \rho
$$
```

:::

### Escaping

When content needs to show literal `$` characters, escape them with a backslash.

```markdown
\$20,000 and \$30,000
```
