# 主题

满足不同用户的色彩、字号、圆角、阴影、深浅模式的偏好。

## 运行时

在 `vp/config/runtime.ts` 中，按需配置是否启用主题功能。

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

## 配置

基于 `vanilla-jui` 的 `Theme` 和 `Offcanvas` 组件实现。

- `options` 和 `panel` 配置项会传递给 `Theme` 组件。
- `offcanvas` 配置项会传递给 `Offcanvas` 组件。

| 配置项                              | 类型              | 默认值         | 说明                                                                                                           |
| ----------------------------------- | ----------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| client.theme                       | boolean \| object | 启用           | 主题配置                                                                                                       |
| `client.theme.enabled`             | boolean           | true           | 是否启用主题功能                                                                                               |
| `client.theme.default`             | object            | -              | 主题启动内联脚本使用的初始主题值                                                                               |
| `client.theme.default.mode`        | "dark" \| "light" | "dark"         | 初始深浅模式；错误值会回退到 "dark"                                                                            |
| `client.theme.default.theme`       | enum              | "indigo"       | 初始色板：gray、olive、tomato、ruby、pink、violet、indigo、blue、teal、grass、mint、lime、yellow、orange、gold |
| `client.theme.default.radius`      | enum              | "sm"           | 初始圆角：sm、md、lg、xl、round                                                                                |
| `client.theme.default.shadow`      | enum              | "sm"           | 初始阴影：none、sm、md、lg                                                                                     |
| `client.theme.default.font`        | enum              | "sm"           | 初始字号：sm、md                                                                                               |
| `client.theme.label`               | string            | "theme.button" | 主题按钮的 i18n key                                                                                            |
| `client.theme.options`             | object            | -              | 传给 `vanilla-jui` Theme 的配置对象                                                                            |
| `client.theme.panel`               | object \| null    | -              | 传给 `theme.createPanel()` 的面板配置                                                                          |
| `client.theme.offcanvas`           | object            | -              | 主题面板抽屉配置对象                                                                                           |
| `client.theme.offcanvas.direction` | string            | "right"        | 主题面板抽屉方向                                                                                               |
