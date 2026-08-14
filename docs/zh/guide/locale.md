# 国际化

让文档站点支持多语言功能，方便不同语言的用户访问。

## 运行时

在 `vp/config/config.ts` 中，按需配置是否启用国际化功能。

- 配置属性：`i18n`
- 配置类型：`boolean` || `object`

```javascript
export default {
  runtime: {
    i18n: {
      enabled: true,
      locale: 'zh-CN',
      fallbackLocale: 'en',
      locales: [
        { code: 'zh-CN', label: '简体中文', path: 'zh' },
        { code: 'en', label: 'English', path: 'en' },
      ],
      redirectToDefault: true,
    },
  },
};
```

## 元数据

`vp/config/config.ts` 中的国际化功能元信息配置：

- `runtime.i18n.locale`: 默认语言
- `runtime.i18n.fallbackLocale`: 备用语言
- `runtime.i18n.locales`: 语言选项数组
  - `code`: 语言别名
  - `label`: 语言名称
  - `path`: 语言路由目录
- `runtime.i18n.redirectToDefault`: 是否重定向到默认语言

## 语言包

在 `vp/config/languages.ts` 中导出语言包数据：

```javascript
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
};
```

## 重定向

用户访问时，根据用户语言偏好或站点语言偏好，自动重定向到对应语言页面。

- 优先级：用户语言偏好 > 站点语言偏好
- 绑定数据：cookie 中的 `locale` 字段
- 禁用：当 `runtime.i18n.redirectToDefault` 为 `false` 或 `runtime.i18n.enabled` 为 `false` 时。
