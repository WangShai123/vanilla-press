# vanilla-press

一个基于 `markdown-it` 与 `vanilla-jui` 的轻量静态文档生成器。

## 项目简介

`vanilla-press` 会将 `docs/` 目录下的 Markdown 文档构建为可部署的静态 HTML，并输出到 `dist/`。
整体采用“编译期 + 运行期”分层设计：

- 编译期负责 Markdown 解析与页面生成。
- 运行期负责组件交互与页面增强。

## v1.0.0 已实现组件

`1.0.0` 版本内置组件：

- `highlight`
- `tabs`
- `accordion`
- `offcanvas`

## 核心设计特点

- 基于组件依赖图（拓扑排序）的初始化顺序。
- 多轮收敛初始化，保障组件可互相嵌套。
- 动态 DOM 变更后的自动补初始化。
- 支持多语言开关、默认语言配置与默认语言 URL 重定向。

## 目录说明

- `docs/`：文档源文件与站点配置（`config.js`、`menu.js`、`sidebar.js`、`languages.js`）。
- `src/`：构建流程与运行时/组件实现。
- `dist/`：构建输出目录。

## 构建命令

```bash
npm install
npm run build
npm run dev
```

- `npm run build`：一次性构建。
- `npm run dev`：监听变更并自动构建。

## 多语言文档结构

当前语言目录：

- `docs/zh/`：中文文档。
- `docs/en/`：英文文档。

当 i18n 启用后，运行时会启用语言切换、按语言路径生成导航链接。

若启用 `redirectToDefault`，访问站点根入口时会自动跳转到默认语言首页。
