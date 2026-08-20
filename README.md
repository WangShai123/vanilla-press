# vanilla-press-repo 维护说明

这个仓库是 `vanilla-press` 的 monorepo，用于同时维护核心包、npm create 脚手架和官网文档。

## 目录架构

```text
vanilla-press-repo/
├── docs/                         # 网站 Markdown 文档，只放页面内容
├── assets/                       # 网站静态资源，构建时复制到 dist/public/
├── vp/
│   ├── config/                   # 网站配置，也是 starter 模板配置源
│   ├── layouts/                  # 网站自定义布局，也是 starter 模板布局源
│   └── components/               # 网站自定义组件，也是 starter 模板组件源
├── packages/
│   ├── vanilla-press/            # 核心构建器、运行时、内置布局和 CLI
│   └── create-vanilla-press/     # npm create 脚手架
└── scripts/
    └── sync-create-template.js   # 将 docs/ 和 vp/ 同步到脚手架模板
```

## 维护命令

- `npm install --workspace vanilla-press`：安装开发环境依赖。
- `npm run fix`：格式检查和修复。
- `npm run build`：在仓库根目录打包官网，读取 `docs/`、`vp/` 和 `assets/`，输出到 `dist/`。
- `npm run dev`：启动官网本地预览服务，监听 `docs/`、`vp/` 和 `assets/` 并自动刷新页面。
- `npm run check`：格式、lint、类型检查。
- `npm run test`：运行核心包测试。
- `npm run sync:create-template`：把根目录 `docs/` 和 `vp/` 同步到 `packages/create-vanilla-press/template/`。
- `npm --workspace vanilla-press run build`：编译核心包发布产物。

## 发布

```bash
npm publish --workspace vanilla-press
npm publish --workspace create-vanilla-press
```

## 忽略规则

- `dist/`
- `packages/*/dist/`
- `packages/create-vanilla-press/template/`
- `coverage/`
- `output/`
- `*.tgz`

## TODO

- 独立的脚手架 template
- 自定义样式支持方案：不使用 vanilla-press 提供的默认样式，而是使用用户自定义的样式（包括 className 类名、属性、层叠样式表等）
  - vanilla-jui css themes 方案
  - vanilla-jui tailwindcss 方案
