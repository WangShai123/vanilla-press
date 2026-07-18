# 主题

满足不同用户的色彩、字号、圆角、阴影、深浅模式的偏好。

## 运行时

在 `docs/config.js` 中，按需配置是否启用主题功能。

```javascript
export const docConfig = {
  theme: true,
};
```

## 配置

基于 `vanilla-jui` 的 `Theme` 和 `Offcanvas` 组件实现。

- `options` 和 `panel` 配置项会传递给 `Theme` 组件。
- `offcanvas` 配置项会传递给 `Offcanvas` 组件。

| 配置项                      | 类型              | 默认值         | 说明                                  |
| --------------------------- | ----------------- | -------------- | ------------------------------------- |
| theme                       | boolean \| object | 启用           | 主题配置                              |
| `theme.enabled`             | boolean           | true           | 是否启用主题功能                      |
| `theme.label`               | string            | "theme.button" | 主题按钮的 i18n key                   |
| `theme.options`             | object            | -              | 传给 `vanilla-jui` Theme 的配置对象   |
| `theme.panel`               | object \| null    | -              | 传给 `theme.createPanel()` 的面板配置 |
| `theme.offcanvas`           | object            | -              | 主题面板抽屉配置对象                  |
| `theme.offcanvas.direction` | string            | "right"        | 主题面板抽屉方向                      |
