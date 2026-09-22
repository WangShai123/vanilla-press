# 国际化

让文档站点支持多语言功能，方便不同语言的用户访问。

## 构建

国际化是默认构建功能，不需要启用开关。`server.i18n` 用来描述语言元数据，构建阶段会按当前页面语言把菜单、侧边栏等文本写入 HTML。

```ts
export default {
  server: {
    i18n: {
      locale: 'zh-CN',
      fallbackLocale: 'en',
      locales: [
        { code: 'zh-CN', label: '中文', path: 'zh' },
        { code: 'en', label: 'EN', path: 'en' },
      ],
      redirectToDefault: true,
    },
  },
}
```

## 元数据

`vp/config/runtime.ts` 中的国际化元信息配置：

- `server.i18n.locale`: 默认语言
- `server.i18n.fallbackLocale`: 备用语言
- `server.i18n.locales`: 语言选项数组
  - `code`: 语言别名
  - `label`: 语言名称
  - `path`: 语言路由目录
- `server.i18n.redirectToDefault`: 是否重定向到默认语言

## 语言包

在 `vp/config/languages.ts` 中导出语言包数据：

```ts
export default {
  'zh-CN': {
    menu: {
      home: '首页',
      guide: '指南',
      components: '组件',
    },
  },
  en: {
    menu: {
      home: 'Home',
      guide: 'Guide',
      components: 'Components',
    },
  },
}
```

## 重定向

用户访问时，根据用户语言偏好或站点语言偏好，自动重定向到对应语言页面。

- 优先级：用户语言偏好 > 站点语言偏好
- 绑定数据：cookie 中的 `locale` 字段
- 禁用重定向：`server.i18n.redirectToDefault` 为 `false` 时。
