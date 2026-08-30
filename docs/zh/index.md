---
layout: home
title: 首页
keywords: vanilla-press, markdown-it, 静态文档生成器
description: vanilla-press 是一款轻量、优雅、自由、高可定制的静态文档生成器。
layouts:
  home:
    hero:
      badge: vanilla press
      title: 轻量 自由 高可定制的静态文档生成器
      description: 只构建需要的，只使用想要的，把最终控制权留给你。
      hint: 内置多语言、搜索、SEO、主题模式等常用运行时和组件。
      actions:
        - text: 快速开始
          link: ./guide/quick-start.html
          variant: is-primary
        - text: 查看组件
          link: ./guide/component-api.html
          variant: is-secondary
    quickStart:
      title: 快速开始
      groups:
        - title: 安装 vanilla-press
          lines:
            - npm create vanilla-press@latest my-docs
            - cd my-docs
        - title: 安装依赖并启动项目
          lines:
            - npm install
            - npm run dev
    features:
      title: 为什么选择 vanilla-press
      description: 保留静态部署的简单性，支持：自定义布局和组件，按需构建最小化运行时。
      items:
        - index: 1
          title: 原生运行时
          description: 不绑定 React, Vue等框架，页面输出简单，自带基于信号的细粒度响应式运行时。
        - index: 2
          title: 易于扩展
          description: 便捷的 API，轻松定制布局、组件、运行时模块，不需要改动主流程。
        - index: 3
          title: 自由组合
          description: 提供依赖管理和 vp-script 能力，轻松与外部连接，实现授权、支付等高级功能。
        - index: 4
          title: Markdown 扩展
          description: 基于 markdown-it 扩展容器组件，用稳定的 data-vp 标记连接构建期和运行时。
        - index: 5
          title: 搜索与 SEO
          description: 构建期生成静态搜索索引，frontmatter 可直接声明标题、描述和关键词。
        - index: 6
          title: 多语言结构
          description: 文档路径、菜单、侧边栏和语言切换都按配置生成，适合中英文站点。
    cta:
      title: 从首页布局开始定制
      description: 当前页面使用 layout: home 和 layouts.home 变量生成，可作为自定义布局模板的参考。
      actions:
        - text: 布局 API
          link: ./guide/layout-api.html
          variant: is-primary
        - text: vp-script API
          link: ./guide/vp-script.html
          variant: is-secondary
---
