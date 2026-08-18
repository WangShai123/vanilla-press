---
layout: home
title: Home
keywords: vanilla-press, markdown-it, static documentation generator
description: vanilla-press is a lightweight, elegant, flexible, and highly customizable static documentation generator.
layouts:
  home:
    hero:
      badge: vanilla press
      title: Lightweight, flexible, highly customizable SSG
      description: Build what you need. Use what you want. Control what you ship.
      hint: Built-in multilingual support, search, SEO, theme modes, and common runtime features and components.
      actions:
        - text: Quick Start
          link: ./guide/quick-start.html
          variant: is-primary
        - text: View Components
          link: ./guide/component-api.html
          variant: is-secondary
    quickStart:
      title: Quick Start
      groups:
        - title: Install vanilla-press
          lines:
            - npm create vanilla-press@latest my-docs
            - cd my-docs
        - title: Install dependencies and start the project
          lines:
            - npm install
            - npm run dev
        - title: Build documentation
          lines:
            - npm run build
    features:
      title: Why vanilla-press
      description: Keep static deployment simple while supporting custom layouts and components, plus a minimized runtime built on demand.
      items:
        - index: 1
          title: Native Runtime
          description: No React or Vue binding. The page output stays simple and includes a signal-based fine-grained reactive runtime.
        - index: 2
          title: Easy to Extend
          description: Convenient APIs make it easy to customize layouts, components, and runtime modules without changing the main build flow.
        - index: 3
          title: Flexible Composition
          description: Dependency management and vp-script support make it easy to connect with external services for advanced features such as auth and payments.
        - index: 4
          title: Markdown Extensions
          description: Extend markdown-it with container components and connect build-time output to runtime behavior through stable data-vp markers.
        - index: 5
          title: Search and SEO
          description: Generate a static search index at build time, and declare titles, descriptions, and keywords directly in frontmatter.
        - index: 6
          title: Multilingual Structure
          description: Generate documentation paths, menus, sidebars, and language switching from configuration, suitable for Chinese and English sites.
    cta:
      title: Start customizing from the home layout
      description: This page is generated with layout: home and layouts.home variables, and can be used as a reference for custom layout templates.
      actions:
        - text: Layout API
          link: ./guide/layout-api.html
          variant: is-primary
        - text: vp-script API
          link: ./guide/vp-script.html
          variant: is-secondary
---
