# Math

VanillaPress includes `markdown-it-mathjax3` and prerenders math in Markdown to static SVG during build.

## Build

Math rendering is enabled by default during build. It does not need a config switch and does not run MathJax in the browser.

## Inline Math

Wrap inline math with single `$` delimiters.

:::tabs
@tab Example

Euler's identity is $e^{i\pi}+1=0$.

@tab Syntax

```markdown
Euler's identity is $e^{i\pi}+1=0$.
```

:::

## Block Math

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

## Escaping

When content needs to show literal `$` characters, escape them with a backslash.

```markdown
\$20,000 and \$30,000
```
