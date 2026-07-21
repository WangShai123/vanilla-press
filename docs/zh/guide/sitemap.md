# 站点地图

帮助搜索引擎更好地抓取网站内容。

## 运行时

在 `docs/config.js` 中，按需配置是否启用站点地图功能。

```javascript
export const docConfig = {
  siteUrl: "https://example.com",
  runtime: {
    sitemap: true,
  },
};
```

站点地图 URL: `https://example.com/sitemap.xml`

## 地址

站点地图中，根据 `siteUrl` 配置的地址，生成对应的 `loc` URL 地址。
