# Theme

Support different user preferences for color, font size, corner radius, shadow, and light or dark mode.

## Runtime

In `vp/config/runtime.ts`, configure whether the theme feature is enabled.

```ts
export default {
  client: {
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
| client.theme                       | boolean \| object | Enabled        | Theme configuration                                                                                                   |
| `client.theme.enabled`             | boolean           | true           | Whether the theme feature is enabled                                                                                  |
| `client.theme.default`             | object            | -              | Initial theme values used by the inline boot script                                                                   |
| `client.theme.default.mode`        | "dark" \| "light" | "dark"         | Initial color mode. Invalid values fall back to "dark"                                                                |
| `client.theme.default.theme`       | enum              | "indigo"       | Initial palette: gray, olive, tomato, ruby, pink, violet, indigo, blue, teal, grass, mint, lime, yellow, orange, gold |
| `client.theme.default.radius`      | enum              | "sm"           | Initial radius: sm, md, lg, xl, round                                                                                 |
| `client.theme.default.shadow`      | enum              | "sm"           | Initial shadow: none, sm, md, lg                                                                                      |
| `client.theme.default.font`        | enum              | "sm"           | Initial font size: sm, md                                                                                             |
| `client.theme.label`               | string            | "theme.button" | i18n key for the theme button label                                                                                   |
| `client.theme.options`             | object            | -              | Options object passed to `vanilla-jui` Theme                                                                          |
| `client.theme.panel`               | object \| null    | -              | Panel config passed to `theme.createPanel()`                                                                          |
| `client.theme.offcanvas`           | object            | -              | Offcanvas config for the theme panel                                                                                  |
| `client.theme.offcanvas.direction` | string            | "right"        | Direction of the theme panel offcanvas                                                                                |
