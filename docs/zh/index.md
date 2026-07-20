---
layout: home
title: 首页
keywords: vanilla-press, markdown-it, 静态文档
description: VanillaPress 是基于 markdown-it 和 vanilla-jui 的轻量静态文档生成器。
layouts:
  home:
    hero:
      badge: vanilla press
      title: 轻量、优雅的静态文档生成器
      description: 基于 `markdown-it` 的静态文档脚手架，按需引用功能和组件，最小化构建 JavaScript 运行时。
      hint: 内置多语言、搜索、SEO、主题模式等常用功能。
      actions:
        - text: 快速开始
          link: ./guide/quick-start.html
          variant: is-primary
        - text: 查看组件
          link: ./guide/components.html
          variant: is-secondary
    quickStart:
      title: 快速开始
      groups:
        - title: NPM 创建
          lines:
            - npm create vanilla-press@latest my-docs
            - cd my-docs
            - npm install
            - npm run dev
        - title: Git 克隆
          lines:
            - git clone https://github.com/WangShai123/vanilla-press.git
            - cd vanilla-press
            - npm install
            - npm run dev
    features:
      title: 为什么选择 VanillaPress
      description: 保留静态部署的简单性，提供必要的运行时增强。
      items:
        - index: 1
          title: 原生运行时
          description: 不绑定 React 或 Vue，页面输出简单，适合低依赖、易部署的文档项目。
        - index: 2
          title: 主题一致
          description: 复用 vanilla-jui 的主题和设计 token，文档框架和组件示例保持同一套视觉语言。
        - index: 3
          title: Markdown 扩展
          description: 基于 markdown-it 扩展容器组件，用稳定的 data-doc 标记连接构建期和运行时。
        - index: 4
          title: 搜索与 SEO
          description: 构建期生成静态搜索索引，frontmatter 可直接声明标题、描述和关键词。
        - index: 5
          title: 多语言结构
          description: 文档路径、菜单、侧边栏和语言切换都按配置生成，适合中英文站点。
        - index: 6
          title: 易于扩展
          description: 布局、组件、运行时模块和工具函数各自分层，新增能力时不需要改动主流程。
    cta:
      title: 从首页布局开始定制
      description: 当前页面使用 layout: home 和 layouts.home 变量生成，可作为自定义布局模板的参考。
      actions:
        - text: 阅读指南
          link: ./guide/quick-start.html
          variant: is-primary
        - text: 查看 API
          link: ./guide/api.html
          variant: is-secondary
---
