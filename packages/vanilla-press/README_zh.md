# vanilla-press

一个轻量、自由、高可定制的静态文档生成器。

> 只构建需要的，只使用想要的，把最终控制权留给用户。

[英文](README.md)

## 特点

- 纯原生：无框架运行时依赖。
- 轻量级：输出资源简单、体积小。
- 个性化：轻松定制布局、样式和组件。
- 自由：按需选择运行时，只构建你需要的。
- 可扩展：支持依赖管理、内联脚本与运行时增强。

## 安装

```bash
npm create vanilla-press@latest my-docs
cd my-docs
npm install
npm run dev
```

## 构建

- `npm run build`: 一次性构建。
- `npm run dev`: 启动本地预览服务，并在变更后自动刷新页面。

`vanilla-press` 会读取 `docs/` 中的源码文件，并将生成后的站点输出到 `dist/`。

## 目录结构

- `dist/`：文档输出目录，可直接部署到静态托管服务。
- `dist/public/`：构建后的静态资源目录，包含 CSS、JS、favicon 和用户 assets。
- `assets/`：用户静态资源目录，构建时复制到 dist/public/。
- `docs/`：文档输入目录，只放 Markdown 页面。
- `vp/config/`：站点配置、运行时配置。
- `vp/layouts/`：用户自定义布局。
- `vp/components/`：用户自定义组件。
- `package.json`：项目依赖配置。
