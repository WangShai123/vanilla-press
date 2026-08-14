# 页脚脚本

页脚脚本用于为站点所有页面统一注入一段 JavaScript。

构建时，`vanilla-press` 会读取 `vp/config/footerScript.ts` 的默认导出内容，并把它写入每个 HTML 页面的 `body` 最下方。

## 配置

在 `vp/config/config.ts` 中配置脚本标签类型：

```typescript
export default {
  runtime: {
    footerScript: 'script',
  },
};
```

`runtime.footerScript` 支持两个值：

| 值       | 输出                                 | 说明               |
| -------- | ------------------------------------ | ------------------ |
| `script` | `<script>...</script>`               | 默认值，普通脚本   |
| `module` | `<script type="module">...</script>` | ES Module 脚本模式 |

## 脚本内容

在 `vp/config/footerScript.ts` 中编写脚本内容：

```typescript
import type { FooterScriptConfig } from 'vanilla-press';

export default `
console.log('site footer script loaded');
` satisfies FooterScriptConfig;
```

构建后，每个页面底部都会输出：

```html
<script>
  console.log('site footer script loaded');
</script>
```

如果 `vp/config/footerScript.ts` 导出空字符串，则不会输出脚本标签。

## 应用场景

页脚脚本适合放置全站通用逻辑，例如网站统计、访问分析、广告转化追踪或站点级初始化代码。

例如接入 Google Analytics：

```typescript
import type { FooterScriptConfig } from 'vanilla-press';

export default `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX');
` satisfies FooterScriptConfig;
```

如果统计服务要求加载外部 SDK，可以在脚本内动态创建 `script` 元素，或使用 `runtime.footerScript: 'module'` 编写模块脚本。
