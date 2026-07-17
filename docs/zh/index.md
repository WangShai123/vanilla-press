# 简介

`vanilla-press` 是基于 `markdown-it` 构建的静态文档工程。

## 特点

- 纯原生：无框架运行时依赖。
- 轻量级：输出资源简单、体积小。
- 可扩展：支持容器组件与运行时增强。

## 安装

```bash
git clone https://github.com/WangShai123/vanilla-press.git
cd vanilla-press
npm install
```

## 使用

- `docs`：文档输入目录，包含 Markdown 页面与站点配置。
- `dist`：文档输出目录，可直接部署到静态托管服务。

## 构建

:::tabs
@tab 手动构建

```bash
npm run build
```

@tab 自动构建

基于 `nodemon` 监听 `docs/` 目录变化并自动构建。

```bash
npm run dev
```

:::

构建命令会读取 `docs/**/*.md`，按目录结构输出到 `dist/**/*.html`，并生成一份共享 CSS 与一份共享 JS。

## 样式

`vanilla-press` 仅提供基础样式，支持在项目中按需覆写。

默认采用 `desktop` 与 `mobile` 双布局策略，访问端会自动切换对应排版并初始化相关交互组件。
