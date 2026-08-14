# vanilla-press

一个基于 `markdown-it` 的静态文档生成器。

## 使用

```bash
npm install -D vanilla-press
```

```json
{
  "scripts": {
    "dev": "vanilla-press dev",
    "build": "vanilla-press build"
  }
}
```

`vanilla-press` 会读取 `docs/` 中的源码文件，并将生成后的站点输出到 `dist/`。
