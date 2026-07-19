# create-vanilla-press

一个基于现有 vanilla-press 模板生成项目的 npm create 脚手架。

- [README](README.md)

## 项目简介

`create-vanilla-press` 会生成一个 vanilla-press 项目，该项目会将 `docs/` 目录下的 Markdown 文档构建为可部署的静态 HTML，并输出到 `dist/`。

整体采用“编译期 + 运行期”分层设计：

- 编译期负责 Markdown 解析与页面生成。
- 运行期负责组件交互与页面增强。

## 安装

Git:

```bash
git clone https://github.com/WangShai123/vanilla-press.git
cd vanilla-press
npm install
```

NPM:

```bash
npm create vanilla-press@latest vanilla-press
cd vanilla-press
npm install
```

## 构建命令

- `npm run build`：一次性构建。
- `npm run dev`：监听变更并自动构建。

## 预览

[在线预览](http://wangshai123.github.io/vanilla-press)
