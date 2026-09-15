# Client 管理

`vp/client` 用来管理项目自定义的浏览器端代码。它服务于传统 MPA 场景：每个页面是独立 HTML，页面脚本按需加载，项目公共代码用稳定的 ESM specifier 复用。

:::tree
vp/client/
├── runtime.ts
├── modules/
│ ├── request.ts
│ └── payment.ts
└── entries/
├── checkout.ts
└── checkout.css
:::

## runtime

`vp/client/runtime.ts` 是项目级公共入口。它会构建为：

```text
dist/public/client/runtime.js
```

在布局脚本或 client entry 中使用固定包名导入：

```ts
import { request } from 'vanilla-press/client'
```

只有当前页面实际用到 `vanilla-press/client` 时，页面才会注入对应 import map。

## modules

`vp/client/modules` 适合放更细粒度的公共模块。

```ts
import { createPayment } from 'vanilla-press/client/modules/payment'
```

上面的导入会解析到：

```text
vp/client/modules/payment.ts
```

并输出为：

```text
dist/public/client/modules/payment.js
```

模块不会默认加载。只有页面脚本、布局脚本或 client entry 实际导入它时，当前页面才会声明 import map。

## entries

`vp/client/entries` 用来编写可复用的页面入口资源，支持 `ts/js/css`。

```ts
// vp/client/entries/checkout.ts
import { createPayment } from 'vanilla-press/client/modules/payment'

createPayment()
```

```css
/* vp/client/entries/checkout.css */
.checkout-panel {
  display: grid;
  gap: 1rem;
}
```

在 Markdown frontmatter 中引用：

```md
---
client:
  entry: checkout
---
```

构建后，该页面会加载：

```html
<link rel="stylesheet" href="./public/client/entries/checkout.css" />
<script type="module" src="./public/client/entries/checkout.js"></script>
```

frontmatter 中声明的是 entry 名称。若 `checkout.ts` 与 `checkout.css` 同时存在，页面会同时加载脚本和样式；若只存在 CSS，则只加载样式。

也可以声明多个入口：

```md
---
client:
  entry:
    - checkout
    - analytics
---
```

入口默认来自 `vp/client/entries/**/*.{ts,js,css}`。需要把其他位置的文件注册为入口时，可以配置 `server.client.entries`，路径相对项目根目录解析：

```ts
export default {
  server: {
    client: {
      entries: {
        dashboard: ['src/client/dashboard.ts', 'src/client/dashboard.css'],
        landing: 'src/client/landing.css',
      },
    },
  },
}
```

## npm 共享依赖

布局脚本和 client entry 中的 npm 依赖默认各自打包。若某些依赖会被多个页面或布局重复使用，可以把它们放入 `server.client.shared`：

```ts
export default {
  server: {
    client: {
      shared: ['lodash-es'],
    },
  },
}
```

共享依赖会进入框架级 `runtime.js`，页面脚本和布局脚本通过 `vanilla-press/runtime` 复用它们。

默认共享依赖包括：

- `vanilla-jui`
- `vanilla-signal`
- `vanilla-create-storage`
- `vanilla-signal-i18n`

## 类型提示

`vanilla-press/client` 的类型由 npm 包提供，指向项目的 `vp/client/runtime.ts`。

`vanilla-press/client/modules/*` 是项目动态模块，推荐在项目 `tsconfig.json` 中配置路径：

```json
{
  "compilerOptions": {
    "paths": {
      "vanilla-press/client/modules/*": ["vp/client/modules/*"]
    }
  }
}
```

## 边界

- `vp/client/runtime.ts`：项目公共浏览器 API。
- `vp/client/modules/*`：可独立复用的业务模块。
- `vp/client/entries/*`：可被页面 frontmatter 按需加载的入口脚本或样式。
- `server.client.shared`：跨页面、跨布局复用的 npm 依赖。
- `client` 配置：浏览器运行时需要的数据，不负责依赖打包。
