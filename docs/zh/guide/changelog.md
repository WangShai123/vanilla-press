# 变更日志

## 1.2.x

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

- feat: 新增 `external-link` 功能覆盖范围，目前覆盖区域：`data-vp-editor`, `data-vp-menu`, `data-vp-sidebar`

#### 1.2.15

- refactor: 脚手架从创建模板升级为创建项目。

#### 1.2.16

- refactor: 重构用户项目侧的架构。

#### 1.2.17

- fix: 修复类型剥离问题。

#### 1.2.18

- chore: 添加 `jsdom` 依赖

## 1.3.x

#### 1.3.0

- fix: 完成 `create-vanilla-press` 和 `vanilla-press` 的架构重构。
- style: 修复侧边栏滚动条问题

#### 1.3.1

- docs: 新增 repo README

#### 1.3.2

- fix: seo 首页标题规则
- docs: 更新布局/组件/vp-script文档。

## 1.4.x

#### 1.4.0

- feat: 新增内置预览服务器和自动刷新功能，默认端口为 3333

#### 1.4.1

- fix: Logo 链接解析兼容多语言环境

#### 1.4.2

- fix: device 模式

#### 1.4.3

- feat: 新增 Badge 组件

#### 1.4.4

- feat: 新增 details 组件

#### 1.4.5

- fix: 修复 dataset 标记错误

#### 1.4.6

- feat: 新增 编辑 和 最后更新时间 功能
- feat: 新增 Group 组件
- feat: `vp` 目录下新增 `cache` 目录，用于缓存构建结果
- feat: 脚手架创建项目时，会自动添加 `.gitignore` 文件，自动忽略 `vp/cache`, `node_modules`
- refactor: 重构 Badge 组件
- fix: 运行时配置结构化拆分为 `runtime` 和 `browser`
- style: 所有 `doc` 关联命名统一前缀为 `vp`
- docs: 更新关联文档

#### 1.4.7

- style: 样式修复

#### 1.4.8

- feat: 新增时区标记

#### 1.4.11

- fix: 优化开发服务器内存管理

#### 1.4.15

- feat: 新增编辑器字号控制功能
- docs: 更新相关文档
