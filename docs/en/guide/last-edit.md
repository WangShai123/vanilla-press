# Last Updated

Last updated shows the most recent content update time on documentation pages.

This is a build-time feature controlled by `build.lastEdit` in `vp/config/runtime.ts`. During build, `vanilla-press` checks whether the page Markdown content has changed and writes the display time into the layout container.

## Configuration

`build.lastEdit` is enabled by default.

```ts
export default {
  build: {
    lastEdit: true,
  },
}
```

- `false` disables last updated.
- `true` uses the default config:

```ts
export default {
  build: {
    lastEdit: {
      text: 'editor.lastUpdated',
      format: 'yyyy-MM-dd HH:mm:ss',
    },
  },
}
```

### text

`text` controls the label text.

The default value is `editor.lastUpdated`, which is resolved through the current locale in `vp/config/languages.ts`.

```ts
export default {
  build: {
    lastEdit: {
      text: 'editor.lastUpdated',
    },
  },
}
```

Default multilingual config:

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

### Date/Time Format

`format` controls how the time is displayed. The default value is:

```ts
'yyyy-MM-dd HH:mm:ss'
```

`vanilla-press` uses [date-fns](https://www.npmjs.com/package/date-fns) `format()` for date/time formatting. The value is formatted in the local timezone of the build environment.

```ts
export default {
  build: {
    lastEdit: {
      format: 'yyyy/MM/dd HH:mm',
    },
  },
}
```

Common tokens:

| token  | meaning                | example |
| ------ | ---------------------- | ------- |
| `yyyy` | four-digit year        | 2026    |
| `MM`   | two-digit month        | 08      |
| `dd`   | two-digit day of month | 19      |
| `HH`   | 24-hour clock          | 14      |
| `mm`   | minutes                | 30      |
| `ss`   | seconds                | 05      |

Common format examples:

| config value           | example output         |
| ---------------------- | ---------------------- |
| `yyyy-MM-dd`           | `2026-08-19`           |
| `yyyy/MM/dd HH:mm`     | `2026/08/19 14:30`     |
| `yyyy年MM月dd日 HH:mm` | `2026年08月19日 14:30` |
| `yyyy-MM-dd HH:mm:ss`  | `2026-08-19 14:30:05`  |

Note that `date-fns` recommends `yyyy` for the calendar year and `dd` for the day of month. Do not reuse old-style `YYYY` and `DD` tokens, or you may get a different meaning or a formatting error.

If the provided `format` cannot be parsed by `date-fns`, `vanilla-press` falls back to the default format `yyyy-MM-dd HH:mm:ss`.

## Cache Rules

Last updated depends on this cache file:

```text
vp/cache/.last-edit.json
```

Build rules:

- Each page computes an identity from the Markdown source content.
- If the page is built for the first time, or the Markdown content changes, the current build time is written.
- If the Markdown content does not change, the cached time is reused.
- Changing runtime config, layout templates, or styles does not refresh a page’s last updated time.
- To force a refresh, change the Markdown source or delete `vp/cache/.last-edit.json` and rebuild.

The cache file is local build state and should not be committed. The scaffold ignores `vp/cache` through `.gitignore` by default.

## Output

When enabled, HTML is generated and emitted.
