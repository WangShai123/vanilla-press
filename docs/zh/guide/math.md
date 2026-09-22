# 数学公式

VanillaPress 内置 `markdown-it-mathjax3`，在构建时把 Markdown 中的数学公式预渲染为静态 SVG。

## 构建

数学公式是默认构建功能，不需要配置开关，也不需要在浏览器运行 MathJax。

## 行内公式

使用单个 `$` 包裹行内公式。

:::tabs
@tab 示例

欧拉公式为 $e^{i\pi}+1=0$。

@tab 语法

```markdown
欧拉公式为 $e^{i\pi}+1=0$。
```

:::

## 块级公式

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

## 转义

当内容需要显示普通 `$` 字符时，使用反斜杠转义。

```markdown
\$20,000 and \$30,000
```
