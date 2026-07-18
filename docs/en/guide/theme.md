# Theme

Support different user preferences for color, font size, corner radius, shadow, and light or dark mode.

## Runtime

In `docs/config.js`, configure whether the theme feature is enabled.

```javascript
export const docConfig = {
  theme: true,
};
```

## Configuration

Implemented with the `Theme` and `Offcanvas` components from `vanilla-jui`.

- The `options` and `panel` options are passed to the `Theme` component.
- The `offcanvas` option is passed to the `Offcanvas` component.

| Option                      | Type              | Default        | Description                                  |
| --------------------------- | ----------------- | -------------- | -------------------------------------------- |
| theme                       | boolean \| object | Enabled        | Theme configuration                          |
| `theme.enabled`             | boolean           | true           | Whether the theme feature is enabled         |
| `theme.label`               | string            | "theme.button" | i18n key for the theme button label          |
| `theme.options`             | object            | -              | Options object passed to `vanilla-jui` Theme |
| `theme.panel`               | object \| null    | -              | Panel config passed to `theme.createPanel()` |
| `theme.offcanvas`           | object            | -              | Offcanvas config for the theme panel         |
| `theme.offcanvas.direction` | string            | "right"        | Direction of the theme panel offcanvas       |
