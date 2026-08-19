# 编辑链接

编辑链接，用于在文档页面中输出“编辑”入口，方便作者直接跳转到文档源文件。

这是一个构建阶段功能，由 `vp/config/runtime.ts` 中的 `build.editLink` 控制。构建时会根据当前页面路径生成链接，输出 HTML。

## 配置

`build.editLink` 默认启用。

```ts
export default {
  build: {
    editLink: true,
  },
}
```

- `false` 表示关闭编辑链接功能。
- `true` 表示使用默认配置：

```ts
export default {
  build: {
    editLink: {
      pattern:
        'https://github.com/WangShai123/vanilla-press/edit/main/docs/:path',
      text: 'editor.editLink',
    },
  },
}
```

### pattern

`pattern` 参数是编辑链接模板，支持 `:path` 占位符。

构建时，`:path` 会被替换为当前页面对应的 Markdown 源文件路径，如：

| 当前页面路径                   | 替换后的 `:path`             |
| ------------------------------ | ---------------------------- |
| `zh/guide/runtime.html`        | `zh/guide/runtime.md`        |
| `zh/guide/component-list.html` | `zh/guide/component-list.md` |
| `/zh/guide/edit-link.html`     | `zh/guide/edit-link.md`      |

转换规则：

- `.html` 后缀会转换为 `.md`。
- 路径开头的 `/` 会被移除。
- 路径中的每一段都会进行 URL 编码。

例如将链接指向自己的 GitHub 仓库：

```ts
export default {
  build: {
    editLink: {
      pattern: 'https://github.com/your-name/your-repo/edit/main/docs/:path',
    },
  },
}
```

### text

`text` 参数控制链接文案。

默认值是 `editor.editLink`，会通过 `vp/config/languages.ts` 读取当前语言对应的文案。

```ts
export default {
  build: {
    editLink: {
      text: 'editor.editLink',
    },
  },
}
```

默认多语言配置：

```ts
export default {
  'zh-CN': {
    editor: {
      editLink: '在 GitHub 上编辑此页面',
    },
  },
  en: {
    editor: {
      editLink: 'Edit this page on GitHub',
    },
  },
}
```

## 输出

仅在启用时，才构建和输出 HTML。
