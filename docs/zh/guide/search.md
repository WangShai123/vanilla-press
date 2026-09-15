# 搜索

按语言隔离的静态资源搜索器。

## 运行时

在 `vp/config/runtime.ts` 中，按需配置是否启用搜索功能。

```ts
export default {
  client: {
    search: true,
  },
}
```

关闭搜索时，构建过程不会输出 `search.js`，页面也不会渲染搜索入口。

## 索引文件

构建搜索功能时，搜索索引文件按站点是否使用多语言输出。

不使用多语言时，构建结果为通用数据文件：

```text
dist/public/search.js
```

使用多语言时，构建结果会按 `server.i18n.locales[].path` 拆分。假设语言路径为 `zh` 和 `en`：

```text
dist/public/search.zh.js
dist/public/search.en.js
```

不同语言页面会在打开搜索时动态加载对应语言的数据文件。例如 `zh` 页面加载 `search.zh.js`，`en` 页面加载 `search.en.js`。

## 延迟加载

页面被访问时，不会直接下载搜索索引文件，只有当用户点击搜索按钮时，才会动态加载搜索索引并打开搜索弹窗。

随着项目的增长，搜索索引文件的大小也会增加。延迟加载可以提高页面加载速度，提高主进程效率和用户体验。
