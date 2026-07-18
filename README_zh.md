# vanilla-press

一个基于 `markdown-it` 与 `vanilla-jui` 的轻量静态文档生成器。

- [README](README.md)

## 项目简介

`vanilla-press` 会将 `docs/` 目录下的 Markdown 文档构建为可部署的静态 HTML，并输出到 `dist/`。

整体采用“编译期 + 运行期”分层设计：

- 编译期负责 Markdown 解析与页面生成。
- 运行期负责组件交互与页面增强。

## 安装

```bash
git clone https://github.com/WangShai123/vanilla-press.git
cd vanilla-press
npm install
```

## 构建命令

- `npm run build`：一次性构建。
- `npm run dev`：监听变更并自动构建。

## 预览

[在线预览](http://wangshai123.github.io/vanilla-press)
