---
layout: home
title: Home
keywords: vanilla-press, markdown-it, static documentation generator
description: vanilla-press is a lightweight, elegant, and highly customizable static documentation generator built with markdown-it.
layouts:
  home:
    hero:
      badge: vanilla press
      title: Lightweight, elegant & highly customizable SSG
      description: Built on markdown-it, with custom layouts and components, on-demand loading, lazy loading, and a minimized JavaScript runtime.
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
      description: Keep static deployment simple while adding the runtime enhancements a documentation site needs.
      items:
        - index: 1
          title: Native Runtime
          description: No React or Vue runtime binding. The output stays simple and works well for low-dependency documentation projects.
        - index: 2
          title: Consistent Theme
          description: Reuse vanilla-jui themes and design tokens so the documentation shell and component examples share the same visual language.
        - index: 3
          title: Markdown Extensions
          description: Extend markdown-it with container components and connect build-time output to runtime behavior through stable data-doc markers.
        - index: 4
          title: Search and SEO
          description: Generate a static search index at build time, and declare titles, descriptions, and keywords directly in frontmatter.
        - index: 5
          title: Multilingual Structure
          description: Generate documentation paths, menus, sidebars, and language switching from configuration, suitable for bilingual sites.
        - index: 6
          title: Easy to Extend
          description: Layouts, components, runtime modules, and utilities are separated so new features do not have to change the main build flow.
    cta:
      title: Start customizing from the home layout
      description: This page is generated with layout: home and layouts.home variables, and can be used as a reference for custom layout templates.
      actions:
        - text: Read the Guide
          link: ./guide/quick-start.html
          variant: is-primary
        - text: View API
          link: ./guide/layout-api.html
          variant: is-secondary
---
