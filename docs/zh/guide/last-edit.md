# 最后更新时间

最后更新时间，用于在文档页面中输出当前页面的最近内容更新时间。

这是一个构建阶段功能，由 `vp/config/runtime.ts` 中的 `build.lastEdit` 控制。构建时会读取页面 Markdown 内容，判断内容是否变化，并把显示时间输出到布局容器中。

## 配置

`build.lastEdit` 默认启用。

```ts
export default {
  build: {
    lastEdit: true,
  },
}
```

- `false` 关闭最后更新时间功能。
- `true` 表示使用默认配置：

```ts
export default {
  build: {
    lastEdit: {
      text: 'editor.lastUpdated',
      format: 'yyyy-MM-dd HH:mm:ss',
      utc: true,
    },
  },
}
```

### text

`text` 参数控制标签文案。

默认值是 `editor.lastUpdated`，会通过 `vp/config/languages.ts` 读取当前语言对应的文案。

```ts
export default {
  build: {
    lastEdit: {
      text: 'editor.lastUpdated',
    },
  },
}
```

默认多语言配置：

```ts
export default {
  'zh-CN': {
    editor: {
      lastUpdated: '最后更新于:',
    },
  },
  en: {
    editor: {
      lastUpdated: 'Last updated:',
    },
  },
}
```

### 日期时间格式

`format` 参数控制时间显示格式，默认值为：

```ts
'yyyy-MM-dd HH:mm:ss'
```

`vanilla-press` 使用 [date-fns](https://www.npmjs.com/package/date-fns) 的 `format()` 处理日期时间格式。时间值会按构建运行环境的本地时区格式化。

```ts
export default {
  build: {
    lastEdit: {
      format: 'yyyy/MM/dd HH:mm',
    },
  },
}
```

常用 token：

| token  | 含义      | 示例 |
| ------ | --------- | ---- |
| `yyyy` | 四位年份  | 2026 |
| `MM`   | 两位月份  | 08   |
| `dd`   | 两位日期  | 19   |
| `HH`   | 24 小时制 | 14   |
| `mm`   | 分钟      | 30   |
| `ss`   | 秒        | 05   |

常用格式示例：

| 配置值                 | 输出示例               |
| ---------------------- | ---------------------- |
| `yyyy-MM-dd`           | `2026-08-19`           |
| `yyyy/MM/dd HH:mm`     | `2026/08/19 14:30`     |
| `yyyy年MM月dd日 HH:mm` | `2026年08月19日 14:30` |
| `yyyy-MM-dd HH:mm:ss`  | `2026-08-19 14:30:05`  |

需要注意，`date-fns` 推荐使用 `yyyy` 表示日历年份，使用 `dd` 表示月份中的日期。不要沿用旧式的 `YYYY` 和 `DD` 写法，否则可能得到错误含义或触发格式错误。

如果传入的 `format` 无法被 `date-fns` 正常解析，`vanilla-press` 会回退到默认格式 `yyyy-MM-dd HH:mm:ss`。

### UTC 标记

`utc` 控制是否在时间后追加当前构建环境的时区标记。

`utc: true` 时，输出会变成这样：

```text
最后更新于: 2026-08-19 23:57:03 UTC+8
```

说明：

- 这里不会把时间转换成 UTC 时间。
- 追加的是构建时环境的当前时区标记，例如 `UTC+8`、`UTC-5`。
- 如果你的 `format` 已经包含时区信息，建议把 `utc` 设为 `false`，避免重复输出。

```ts
export default {
  build: {
    lastEdit: {
      utc: false,
    },
  },
}
```

## 缓存规则

最后更新时间依赖缓存文件：

```text
vp/cache/.last-edit.json
```

构建规则：

- 每个页面会按 Markdown 源内容计算内容标识。
- 如果页面第一次构建，或 Markdown 内容发生变化，会写入当前构建时间。
- 如果 Markdown 内容没有变化，会复用缓存中的时间。
- 只修改运行时配置、布局模板或样式，不会刷新某个页面的最后更新时间。
- 如需强制刷新时间，可以修改对应 Markdown 内容，或删除 `vp/cache/.last-edit.json` 后重新构建。

缓存文件属于本地构建状态，不建议提交到仓库。脚手架默认会通过 `.gitignore` 忽略 `vp/cache`。

## 输出

仅在启用时，才构建和输出 HTML。
