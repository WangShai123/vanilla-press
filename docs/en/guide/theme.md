# Theme

Support different user preferences for color, font size, corner radius, shadow, and light or dark mode.

## Runtime

In `vp/config/runtime.ts`, configure whether the theme feature is enabled.

```ts
export default {
  browser: {
    theme: {
      enabled: true,
      default: {
        mode: 'dark',
        theme: 'indigo',
        radius: 'sm',
        shadow: 'sm',
        font: 'sm',
      },
      offcanvas: {
        direction: 'right',
      },
    },
  },
}
```

## Configuration

Implemented with the `Theme` and `Offcanvas` components from `vanilla-jui`.

- The `options` and `panel` options are passed to the `Theme` component.
- The `offcanvas` option is passed to the `Offcanvas` component.

| Option                              | Type              | Default        | Description                                                                                                           |
| ----------------------------------- | ----------------- | -------------- | --------------------------------------------------------------------------------------------------------------------- |
| browser.theme                       | boolean \| object | Enabled        | Theme configuration                                                                                                   |
| `browser.theme.enabled`             | boolean           | true           | Whether the theme feature is enabled                                                                                  |
| `browser.theme.default`             | object            | -              | Initial theme values used by the inline boot script                                                                   |
| `browser.theme.default.mode`        | "dark" \| "light" | "dark"         | Initial color mode. Invalid values fall back to "dark"                                                                |
| `browser.theme.default.theme`       | enum              | "indigo"       | Initial palette: gray, olive, tomato, ruby, pink, violet, indigo, blue, teal, grass, mint, lime, yellow, orange, gold |
| `browser.theme.default.radius`      | enum              | "sm"           | Initial radius: sm, md, lg, xl, round                                                                                 |
| `browser.theme.default.shadow`      | enum              | "sm"           | Initial shadow: none, sm, md, lg                                                                                      |
| `browser.theme.default.font`        | enum              | "sm"           | Initial font size: sm, md                                                                                             |
| `browser.theme.label`               | string            | "theme.button" | i18n key for the theme button label                                                                                   |
| `browser.theme.options`             | object            | -              | Options object passed to `vanilla-jui` Theme                                                                          |
| `browser.theme.panel`               | object \| null    | -              | Panel config passed to `theme.createPanel()`                                                                          |
| `browser.theme.offcanvas`           | object            | -              | Offcanvas config for the theme panel                                                                                  |
| `browser.theme.offcanvas.direction` | string            | "right"        | Direction of the theme panel offcanvas                                                                                |
