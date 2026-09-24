---
keywords: 运行时, 代码高亮, 数学公式, vanilla-press
description: 介绍 Vanilla Press 运行时相关功能，包含代码高亮、数学公式等。
---

# 运行时

## 代码高亮

基于 `Shiki` 的代码高亮，构建时预渲染为静态 HTML。

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

### 行高亮

在代码块语言后添加 `{行号}`，可以高亮指定行。支持单行、多个行号和连续范围。

:::tabs
@tab 示例

```ts {2,4-6}
const name = 'VanillaPress'
const version = '1.5'

export function info() {
  return `${name}@${version}`
}
```

@tab 语法

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

也可以使用 `[!code highlight]`。写在代码行末尾时作用于当前行；独占注释行时作用于下一行。标记会在构建时移除，不会出现在最终 HTML 中。

:::tabs
@tab 示例

```ts
const name = 'VanillaPress'
const version = '1.5' // [!code highlight]

export function info() {
  // [!code highlight:3]
  return `${name}@${version}`
}
```

@tab 语法

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

`[!code highlight:3]` 表示从目标行开始，连续高亮 3 行。

### 聚焦代码

使用 `[!code focus]` 可以突出关键代码，并弱化同一代码块中的其他行。

:::tabs
@tab 示例

```ts
const name = 'VanillaPress'
const version = '1.5' // [!code focus]

export function info() {
  return `${name}@${version}` // [!code focus]
}
```

@tab 语法

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

同样支持连续行写法：

:::tabs
@tab 示例

```ts
export function createApp() {
  // [!code focus:3]
  const app = {}
  return app
}
```

@tab 语法

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

### 代码块中的颜色差异

使用 `[!code ++]` 和 `[!code --]` 表示新增和删除行，适合展示修改前后的差异。

:::tabs
@tab 示例

```ts
const theme = 'github-light-default'
const darkTheme = 'github-dark-default' // [!code --]
const darkTheme = 'github-dark-high-contrast' // [!code ++]
```

@tab 语法

````markdown
```ts
const theme = 'github-light-default'
const darkTheme = 'github-dark-default' // [!code --]
const darkTheme = 'github-dark-high-contrast' // [!code ++]
```
````

:::

### 高亮错误和警告

使用 `[!code warning]` 和 `[!code error]` 标记警告或错误行。

:::tabs
@tab 示例

```ts
function loadTheme(theme?: string) {
  if (!theme) return 'github-light-default' // [!code warning]
  if (theme === 'unknown') throw new Error('Invalid theme') // [!code error]

  return theme
}
```

@tab 语法

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

### 行号

在代码块语言后添加 `line-numbers` 可以显示行号。

:::tabs
@tab 示例

```ts line-numbers
export const siteName = 'VanillaPress'
export const version = '1.5'
```

@tab 语法

````markdown
```ts line-numbers
export const siteName = 'VanillaPress'
export const version = '1.5'
```
````

:::

也可以指定起始行号：

:::tabs
@tab 示例

```ts line-numbers=10
export function mount() {
  return true
}
```

@tab 语法

````markdown
```ts line-numbers=10
export function mount() {
  return true
}
```
````

:::

## 数学公式

使用 `mathjax3` 在构建时把 Markdown 中的数学公式预渲染为静态 SVG。

### 行内公式

使用单个 `$` 包裹行内公式。

:::tabs
@tab 示例

欧拉公式为 $e^{i\pi}+1=0$。

@tab 语法

```markdown
欧拉公式为 $e^{i\pi}+1=0$。
```

:::

### 块级公式

使用 `$$` 包裹块级公式。

:::tabs
@tab 示例

$$
\nabla \cdot \vec{\mathbf{E}} = 4 \pi \rho
$$

@tab 语法

```markdown
$$
\nabla \cdot \vec{\mathbf{E}} = 4 \pi \rho
$$
```

:::

### 转义

当内容需要显示普通 `$` 字符时，使用反斜杠转义。

```markdown
\$20,000 and \$30,000
```
