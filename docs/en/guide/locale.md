# Internationalization

Enable multilingual documentation so users can browse the site in different languages.

## Runtime

In `vp/config/runtime.ts`, configure whether internationalization is enabled.

- Configuration property: `i18n`
- Configuration type: `boolean` | `object`

```ts
export default {
  browser: {
    i18n: {
      enabled: true,
      locale: 'zh-CN',
      fallbackLocale: 'en',
      locales: [
        { code: 'zh-CN', label: 'Simplified Chinese', path: 'zh' },
        { code: 'en', label: 'English', path: 'en' },
      ],
      redirectToDefault: true,
    },
  },
}
```

## Metadata

In `vp/config/runtime.ts`, configure the site's i18n language metadata:

- `browser.i18n.locale`: default language
- `browser.i18n.fallbackLocale`: fallback language
- `browser.i18n.locales`: array of language options
  - `code`: locale code
  - `label`: language name
  - `path`: locale route directory
- `browser.i18n.redirectToDefault`: whether to redirect

## Language Pack

In `vp/config/languages.ts`, export the locale message data:

```ts
export default {
  'zh-CN': {
    menu: {
      home: '首页',
      guide: '指南',
      components: '组件',
      api: 'API',
    },
  },
  en: {
    menu: {
      home: 'Home',
      guide: 'Guide',
      components: 'Components',
      api: 'API',
    },
  },
}
```

## Redirect

Automatically redirect users to the corresponding language page based on their language preference or the site's language preference.

- Priority: user language preference > site language preference
- Bound data: `locale` field in cookies
- Disabled: when `browser.i18n.redirectToDefault` is `false` or `browser.i18n.enabled` is `false`.
