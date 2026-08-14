# 快速开始

`vanilla-press` 是基于 `markdown-it` 构建的静态文档工程。

## 特点

- 纯原生：无框架运行时依赖。
- 轻量级：输出资源简单、体积小。
- 个性化：轻松定制布局、样式和组件。
- 可扩展：支持容器组件与运行时增强。

## 安装

`npm create` 会生成项目文件，但不会安装新项目的依赖。进入项目目录后，需要先执行 `npm install`，再启动开发构建。

```bash
npm create vanilla-press@latest vanilla-press
cd vanilla-press
npm install
npm run dev
```

## 构建

构建命令会读取 `docs/**/*.md`，按目录结构输出到 `dist/**/*.html`，并生成相关的 CSS 与 JS 运行时。

:::tabs
@tab 手动构建

```bash
npm run build
```

@tab 自动构建

基于 `nodemon` 监听 `docs/` 与 `vp/` 目录变化并自动构建。

```bash
npm run dev
```

:::

## 样式

`vanilla-press` 采用 `desktop` 与 `mobile` 隔离策略，会根据用户设备类型，加载对应运行时和渲染样式。

`vanilla-press` 会从已安装的 `vanilla-press` 依赖包中提供基础样式。

项目级自定义位于 `vp/`，例如可以通过 `vp/layouts/` 添加自定义布局和样式。

## 项目架构

- `dist`：文档输出目录，可直接部署到静态托管服务。
- `dist/public`：构建后的静态资源目录，包含 CSS、JS、favicon 和用户 assets。
- `assets`：用户静态资源目录，构建时复制到 `dist/public/`。
- `docs`：文档输入目录，只放 Markdown 页面。
- `vp/config`：站点配置、多语言、菜单、侧边栏等配置。
- `vp/layouts`：项目自定义布局。
- `vp/components`：项目自定义组件。
- `package.json`：项目脚本与 `vanilla-press` 依赖。

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

## 配置目录说明

项目目录按职责分离：

- `docs/` 只存放 Markdown 文档。
- `assets/` 存放用户静态资源，例如 `favicon.ico`。
- `vp/config/` 存放 `config.ts`、`languages.ts`、`menu.ts`、`sidebar.ts`、`robots.ts`、`llms.ts`、`footerScript.ts`。
- `vp/layouts/` 存放用户自定义布局，等同于旧版本的 `docs/_layouts/`。
- `vp/components/` 存放用户自定义 Markdown 组件和运行时增强代码。

目的：拎包即用，提箱即走。
