# 站点地图

帮助搜索引擎更好地抓取网站内容。

## 运行时

在 `docs/config.ts` 中，按需配置是否启用站点地图功能。

```javascript
export default {
  siteUrl: 'https://example.com',
  runtime: {
    sitemap: true,
  },
};
```

## 地址

根据 `siteUrl` 配置的地址，生成对应的 URL 地址。

- 站点地图地址：`https://example.com/sitemap.xml`
- loc 地址：`https://example.com/**/*.html`
