# vanilla-press-repo 维护说明

这个仓库是 `vanilla-press` 的 monorepo，用于同时维护核心包、npm create 脚手架和官网文档。

## 目录架构

```text
vanilla-press-repo/
├── docs/                         # 官网 Markdown 文档，只放页面内容
├── assets/                       # 官网静态资源，构建时复制到 dist/public/
├── vp/
│   ├── config/                   # 官网配置，也是 starter 模板配置源
│   ├── layouts/                  # 官网自定义布局，也是 starter 模板布局源
│   └── components/               # 官网自定义组件，也是 starter 模板组件源
├── packages/
│   ├── vanilla-press/            # 核心构建器、运行时、内置布局和 CLI
│   └── create-vanilla-press/     # npm create 脚手架
└── scripts/
    └── sync-create-template.js   # 将 docs/ 和 vp/ 同步到脚手架模板
```

## 维护命令

- `npm run build`：在仓库根目录打包官网，读取 `docs/`、`vp/` 和 `assets/`，输出到 `dist/`。
- `npm run dev`：监听 `docs/` 和 `vp/`，自动重新构建官网。
- `npm run check`：格式、lint、类型检查。
- `npm run test`：运行核心包测试。
- `npm run sync:create-template`：把根目录 `docs/` 和 `vp/` 同步到 `packages/create-vanilla-press/template/`。
- `npm --workspace vanilla-press run build`：编译核心包发布产物。

## 发布

发布时，在根目录按顺序执行：

```bash
npm publish --workspace vanilla-press
npm publish --workspace create-vanilla-press
```

先发布 `vanilla-press`，再发布 `create-vanilla-press`。这样脚手架生成项目时写入的 `vanilla-press@^版本号` 已经存在于 npm。

## 忽略规则

根目录 `vp/` 不能加入 `.gitignore`。它是官网和 starter 模板的源数据，忽略后仓库无法复现脚手架模板。

根目录 `assets/` 也不能加入 `.gitignore`。它保存默认 favicon 和官网静态资源，也是 starter 模板的资源源目录。

适合忽略的是生成物：

- `dist/`
- `packages/*/dist/`
- `packages/create-vanilla-press/template/`
- `coverage/`
- `output/`
- `*.tgz`
