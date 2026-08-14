# Theme

Support different user preferences for color, font size, corner radius, shadow, and light or dark mode.

## Runtime

In `vp/config/config.ts`, configure whether the theme feature is enabled.

```javascript
export default {
  runtime: {
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
};
```

## Configuration

Implemented with the `Theme` and `Offcanvas` components from `vanilla-jui`.

- The `options` and `panel` options are passed to the `Theme` component.
- The `offcanvas` option is passed to the `Offcanvas` component.

| Option                              | Type              | Default        | Description                                                                                                           |
| ----------------------------------- | ----------------- | -------------- | --------------------------------------------------------------------------------------------------------------------- |
| runtime.theme                       | boolean \| object | Enabled        | Theme configuration                                                                                                   |
| `runtime.theme.enabled`             | boolean           | true           | Whether the theme feature is enabled                                                                                  |
| `runtime.theme.default`             | object            | -              | Initial theme values used by the inline boot script                                                                   |
| `runtime.theme.default.mode`        | "dark" \| "light" | "dark"         | Initial color mode. Invalid values fall back to "dark"                                                                |
| `runtime.theme.default.theme`       | enum              | "indigo"       | Initial palette: gray, olive, tomato, ruby, pink, violet, indigo, blue, teal, grass, mint, lime, yellow, orange, gold |
| `runtime.theme.default.radius`      | enum              | "sm"           | Initial radius: sm, md, lg, xl, round                                                                                 |
| `runtime.theme.default.shadow`      | enum              | "sm"           | Initial shadow: none, sm, md, lg                                                                                      |
| `runtime.theme.default.font`        | enum              | "sm"           | Initial font size: sm, md                                                                                             |
| `runtime.theme.label`               | string            | "theme.button" | i18n key for the theme button label                                                                                   |
| `runtime.theme.options`             | object            | -              | Options object passed to `vanilla-jui` Theme                                                                          |
| `runtime.theme.panel`               | object \| null    | -              | Panel config passed to `theme.createPanel()`                                                                          |
| `runtime.theme.offcanvas`           | object            | -              | Offcanvas config for the theme panel                                                                                  |
| `runtime.theme.offcanvas.direction` | string            | "right"        | Direction of the theme panel offcanvas                                                                                |
