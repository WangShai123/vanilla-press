# Edit Link

The edit link shows an “Edit” entry on documentation pages so authors can jump directly to the source file.

This is a build-time feature controlled by `build.editLink` in `vp/config/runtime.ts`. During build, `vanilla-press` generates a link from the current page path and writes it to HTML.

## Configuration

`build.editLink` is enabled by default.

```ts
export default {
  build: {
    editLink: true,
  },
}
```

- `false` disables the edit link.
- `true` uses the default config:

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

`pattern` is the edit link template and supports the `:path` placeholder.

During build, `:path` is replaced with the Markdown source path for the current page:

| Current page path              | Replaced `:path`             |
| ------------------------------ | ---------------------------- |
| `zh/guide/runtime.html`        | `zh/guide/runtime.md`        |
| `zh/guide/component-list.html` | `zh/guide/component-list.md` |
| `/zh/guide/edit-link.html`     | `zh/guide/edit-link.md`      |

Conversion rules:

- The `.html` suffix becomes `.md`.
- A leading `/` is removed.
- Each path segment is URL-encoded.

For example, point the link to your own GitHub repository:

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

`text` controls the link label.

The default value is `editor.editLink`, which is resolved through the current locale in `vp/config/languages.ts`.

```ts
export default {
  build: {
    editLink: {
      text: 'editor.editLink',
    },
  },
}
```

Default multilingual config:

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

## Output

When enabled, HTML is generated and emitted.
