# 快速开始

`vanilla-press` 是一款轻量、自由、高可定制的静态文档生成器。

> 只构建需要的，只使用想要的，把最终控制权留给用户。

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

构建命令会读取文档目录 `docs/**/*.md`、扩展与配置目录 `vp/`、静态资源目录 `assets/`，并按目录结构输出静态 HTML 文件到 `dist/**/*.html`，并生成相关的 CSS 与 JS 运行时。站点配置现在放在 `vp/config/runtime.ts`，其中构建阶段配置放在 `build`，浏览器运行时配置放在 `browser`。

:::tabs
@tab 手动构建

```bash
npm run build
```

@tab 本地预览

启动本地预览服务。`docs/`、`vp/` 和 `assets/` 目录变化后会重新构建，并自动刷新浏览器页面。

```bash
npm run dev
```

:::

## 项目架构

- `dist/`：HTML 站点输出目录，可直接部署到静态托管服务。
- `dist/public/`：构建后的静态资源目录，包含 CSS、JS、favicon、图片等。
- `assets/`：静态资源输入目录。
- `docs/`：文档输入目录，只放 Markdown 页面。
- `vp/config/runtime.ts`：站点配置入口，分为 `build` 和 `browser`。
- `vp/layouts/`：自定义布局。
- `vp/components/`：自定义组件。

:::tree
vanilla-press/
├── dist/
│ └── public/
├── assets/
│ └── favicon.ico
├── docs/
├── vp/
│ ├── config/
│ ├── layouts/
│ └── components/
├── package.json
└── README.md
:::

## 样式

`vanilla-press` 采用 `desktop` 与 `mobile` 隔离策略，会根据用户设备类型，加载对应运行时和渲染样式。
