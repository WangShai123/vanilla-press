# 组件 API

项目组件位于 `vp/components/`。构建时会加载这些组件；如果组件提供运行时增强代码，会被打包成独立组件脚本，而不是合并进 `runtime.js`。

## 目录约定

组件可以是单文件，也可以是带 `index.ts` 的目录：

:::tree
vp/
├── components/
│ ├── badge.ts
│ └── callout/
│ │ └── index.ts
:::

VanillaPress 会加载 `vp/components/*.ts`、`vp/components/*.js`、`vp/components/*/index.ts`、`vp/components/*/index.js`。

## 组件约定

组件模块导出一个组件对象：

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

## Markdown 使用

```markdown
:::badge Stable
```

构建期 `install` 用于注册 Markdown 语法；当页面使用组件时，需要调用 `markComponent(env, name)`。运行时 `init` 是可选的；如果存在，会被打包成 `dist/public/组件名.hash.js`，并且只在使用了该组件的 HTML 页面中加载。

组件 `init` 中静态导入的本地 npm 依赖，会一起打包进该组件脚本文件，不会进入全局 `runtime.js`。

## 运行时规则

- 渲染后的根元素必须包含 `data-doc-component="<name>"`。
- 运行时代码只扫描传入的 `root` 范围。
- 已标记 `data-doc-ready="true"` 的元素必须跳过。
- 初始化完成后，需要写入 `data-doc-ready="true"`。
- 如果组件依赖其他组件先初始化，通过 `dependsOn` 声明。

依赖示例：

```typescript
export default {
  name: 'panel-tabs',
  dependsOn: ['tabs'],
  install(md, context) {
    // 注册 Markdown 语法。
  },
  init(root) {
    // 会在 tabs 之后执行。
  },
} satisfies MarkdownComponentDefinition;
```

## 初始化模型

浏览器运行时会合并内置组件和项目组件，自动展开依赖关系，按依赖顺序初始化，并多轮执行直到没有待初始化节点。运行时也会监听动态插入的 DOM，自动补初始化新增的 `data-doc-component` 节点。

项目组件脚本按页面加载：页面实际使用了哪些项目组件，就动态导入对应的 `dist/public/组件名.hash.js`。如果组件声明了 `dependsOn`，并且依赖项也是项目组件，依赖组件脚本也会被加载。
