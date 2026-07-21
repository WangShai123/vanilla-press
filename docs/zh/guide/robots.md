# Robots

生成 `robots.txt`，用于告诉搜索引擎哪些路径可以抓取。

## 运行时开关

`runtime.robots` 默认启用。只有设置为 `false` 时，构建过程才会跳过 `docs/robots.js`，并且不会输出 `dist/robots.txt`。

```javascript
export const docConfig = {
  runtime: {
    robots: false,
  },
};
```

## 配置文件

在 `docs/robots.js` 中配置输出内容。项目里的配置会覆盖默认配置。

```javascript
export const robots = {
  rules: [
    {
      userAgent: "*",
      allow: ["/"],
      disallow: ["/private/"],
    },
  ],
  sitemap: true,
  llms: true,
};
```

## 字段

| 字段       | 类型                      | 说明                                                        |
| ---------- | ------------------------- | ----------------------------------------------------------- |
| rules      | array                     | `robots.txt` 的规则组，每一项会输出一个 `User-agent` 块     |
| userAgent  | string \| array           | 抓取器名称，默认 `*`                                        |
| allow      | string \| array           | 输出 `Allow` 规则                                           |
| disallow   | string \| array           | 输出 `Disallow` 规则                                        |
| crawlDelay | string \| number          | 输出 `Crawl-delay` 规则                                     |
| sitemap    | boolean \| string \| array | 为 `true` 时输出 `${siteUrl}/sitemap.xml`，也可指定自定义地址 |
| llms       | boolean \| string \| array | 为 `true` 时输出 `${siteUrl}/llms.txt`，也可指定自定义地址    |

## 输出

构建后访问：

`https://example.com/robots.txt`
