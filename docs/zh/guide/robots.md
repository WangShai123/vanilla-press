# Robots

生成 `robots.txt`，用于告诉搜索引擎哪些路径可以抓取。

## 运行时

`runtime.robots` 默认启用。

```javascript
export default {
  runtime: {
    robots: false,
  },
};
```

当 `runtime.robots` 为 `false` 时，不会构建 `dist/robots.txt`。

## 配置

在 `vp/config/robots.ts` 中配置输出内容。

```javascript
export default {
  rules: [
    {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/private/'],
    },
  ],
};
```

## 字段

| 字段       | 类型             | 说明                                                    |
| ---------- | ---------------- | ------------------------------------------------------- |
| rules      | array            | `robots.txt` 的规则组，每一项会输出一个 `User-agent` 块 |
| userAgent  | string \| array  | 抓取器名称，默认 `*`                                    |
| allow      | string \| array  | 输出 `Allow` 规则                                       |
| disallow   | string \| array  | 输出 `Disallow` 规则                                    |
| crawlDelay | string \| number | 输出 `Crawl-delay` 规则                                 |

## 输出

根据 `siteUrl` 配置的地址，生成对应的 URL 地址。

- Robots 地址：`https://example.com/robots.txt`
