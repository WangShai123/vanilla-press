# 站点地图

帮助搜索引擎更好地抓取网站内容。

## 输出规则

当 `siteUrl` 是有效的 `http(s)` 绝对地址时，构建阶段会输出 `dist/sitemap.xml`。未配置有效 `siteUrl` 时，不会输出 sitemap。

## 地址

根据 `siteUrl` 配置的地址，生成对应的 URL 地址。

- 站点地图地址：`https://example.com/sitemap.xml`
- loc 地址：`https://example.com/**/*.html`
