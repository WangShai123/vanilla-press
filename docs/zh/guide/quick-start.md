# 快速开始

`vanilla-press` 是基于 `markdown-it` 构建的静态文档工程。

## 特点

- 纯原生：无框架运行时依赖。
- 轻量级：输出资源简单、体积小。
- 个性化：轻松定制布局、样式和组件。
- 可扩展：支持容器组件与运行时增强。

## 安装

:::tabs
@tab git

```bash
git clone https://github.com/WangShai123/vanilla-press.git
cd vanilla-press
npm install
```

@tab npm

```bash
npm create vanilla-press@latest vanilla-press
cd vanilla-press
npm install
```

:::

也可以直接调用根包里的同一套初始化命令：

```bash
npx vanilla-press@latest init vanilla-press
cd vanilla-press
npm install
```

## 构建

构建命令会读取 `docs/**/*.md`，按目录结构输出到 `dist/**/*.html`，并生成一份共享 CSS 与 JS 运行时。

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

## 样式

`vanilla-press` 采用 `desktop` 与 `mobile` 隔离策略，会根据用户设备类型，加载对应运行时和渲染样式。

`vanilla-press` 仅提供基础样式，并在 `src/config/style.js` 设置样式 `预设源`。

您可以通过 覆写 `style.css` 和变更 `src/config/style.js` 预设源，来 100% 完全定制样式。

## 项目架构

- `dist`：文档输出目录，可直接部署到静态托管服务。
- `docs`：文档输入目录，包含 Markdown 页面与站点配置。
- `src`：源码目录，包含运行时、渲染器、组件、工具函数等。

:::tree
vanilla-press/
├── dist/
├── docs/
├── src/
│ ├── components/
│ ├── config/
│ ├── core/
│ ├── render/
│ ├── runtime/
│ ├── utilities/
│ ├── build.js
│ ├── runtime.js
│ └── style.css
├── package.json
└── README.md
:::

## 内置运行时

- 菜单
- 代码高亮
- 分页
- 国际化
- 目录
- SEO
- 搜索
- 主题

## 内置组件

- accordion
- offcanvas
- tabs
- tree
