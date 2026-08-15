# 变更日志

## 1.2.x

目标：基础版本功能完善。

#### 1.2.10

- feat: 新增 `vp-script` 内联脚本功能，支持在 Markdown 中使用 `vp-script` 编写当前页面专用脚本。
- feat: 新增 `footer-script` 页脚脚本功能，支持通过 `vp/config/footerScript.ts` 为所有页面统一注入底部脚本。
- chore: 更新依赖版本
- fix: 根据依赖更新，收窄类型，让类型定义更严格和精准

#### 1.2.11

- fix: 修复依赖更新后引发的主题模式错误。

#### 1.2.12

- fix: 修复依赖更新后引发的编辑器样式错误。

#### 1.2.13

- fix: 移除非规范robots配置

#### 1.2.14

- feat: 新增 `external-link` 功能覆盖范围，目前覆盖区域：`data-doc-editor`, `data-doc-menu`, `data-doc-sidebar`

#### 1.2.15

- refactor: 脚手架从创建模板升级为创建项目。

#### 1.2.16

- refactor: 重构用户项目侧的架构。

#### 1.2.17

- fix: 修复类型剥离问题。

#### 1.2.18

- chore: 添加 `jsdom` 依赖

## 1.3.x

目标：完成基础版本的架构重构，提供更稳定和更易用的 API。

#### 1.3.0

- fix: 完成 `create-vanilla-press` 和 `vanilla-press` 的架构重构。
- style: 修复侧边栏滚动条问题

#### 1.3.1

- docs: 新增 repo README

#### 1.3.2

- fix: seo 首页标题规则
- docs: 更新布局/组件/vp-script文档。
