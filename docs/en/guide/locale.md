# Internationalization

Enable multilingual documentation so users can browse the site in different languages.

## Build

Internationalization is enabled by default during build and does not need a switch. `server.i18n` describes locale metadata, and the build writes translated menu, sidebar, and related text into HTML for the current page locale.

```ts
export default {
  server: {
    i18n: {
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

In `vp/config/runtime.ts`, configure the site's i18n metadata:

- `server.i18n.locale`: default language
- `server.i18n.fallbackLocale`: fallback language
- `server.i18n.locales`: array of language options
  - `code`: locale code
  - `label`: language name
  - `path`: locale route directory
- `server.i18n.redirectToDefault`: whether to redirect

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
- Disable redirect: set `server.i18n.redirectToDefault` to `false`.
