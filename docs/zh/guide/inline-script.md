# 内联脚本

`inline-script` 用于在某个 Markdown 页面内编写当前页面专用的 JavaScript。

构建时，`vanilla-press` 会把 `vp-script` 代码块从正文中移除，合并为一个独立的页面脚本文件，并只在当前页面 HTML 中引用。

## 示例

<button data-demo-button class="j-button is-outline">点击我</button>

```vp-script
import { Toast } from 'vanilla-jui';
import { createSignal, createEffect } from 'vanilla-signal';

const button = document.querySelector('[data-demo-button]');

const [toast, setToast] = createSignal(false);
button?.addEventListener('click', () => {
  if (toast()) return;
  setToast(true);
  const [loading, setLoading] = createSignal(true);
  Toast.primary('嗨，你成功地点击了我。',{
    loading,
    onCancel: () => {
      setLoading(false);
      Toast.lite('已取消加载');
      setToast(false);
    },
  });
  setTimeout(() => {setLoading(false); setToast(false)}, 2000);
});
createEffect(() => {
  button.disabled = toast();
});
```

## 语法

````markdown
```vp-script
const button = document.querySelector('[data-demo-button]');

button?.addEventListener('click', () => {
  console.log('clicked');
});
```
````

`vp-script` 代码块不会渲染为代码示例。如果需要展示 JavaScript 示例，请继续使用 `javascript` 或 `js` 代码块。

## 输出

假设当前文档是：

```text
docs/zh/guide/api.md
```

构建后会输出当前页面专用脚本：

```text
dist/zh/guide/xx.hash.js
```

当前页面 HTML 会自动引用它：

```html
<script type="module" src="./xx.hash.js"></script>
```

其他页面不会引用这份脚本。

## 执行时机

页面脚本会作为 `type="module"` 脚本插入到页面运行时之后。

因此脚本可以访问当前页面 DOM，并适合绑定仅属于当前页面的交互逻辑。

## 静态导入

在 `vp-script` 中可以直接使用静态 `import` 引入本地 npm 依赖包：

````markdown
```vp-script
import { Toast } from 'vanilla-jui';

const button = document.querySelector('[data-demo-button]');

button?.addEventListener('click', () => {
  Toast.show('clicked');
});
```
````

## 依赖管理

`vanilla-press` 依赖管理策略：

- 共享依赖：打包进 `runtime.js` 脚本文件，供所有页面脚本复用的依赖。
- 独立依赖：仅属于当前页面自己的 `xx.hash.js` 依赖。

构建时，`vanilla-press` 会根据共享依赖的白名单列表，自动判断哪些依赖是共享依赖，哪些是独立依赖。

- 当 `vp-script` 静态引入合法的共享依赖时，构建会自动把该导入改写为从 `runtime.js` 读取，并在当前页面加入 import map。用户不需要手写 import map。
- 不在共享列表中的静态导入只会打包进当前页面自己的 `xx.hash.js` 脚本文件。

## 共享依赖白名单

用户可以在 `vp/config/config.ts` 中扩展共享依赖白名单列表：

```javascript
export default {
  runtime: {
    inlineScript: {
      shared: ['lodash-es'],
    },
  },
};
```

`runtime.inlineScript.shared` 会和默认列表合并，不会替换默认值。

默认共享依赖白名单列表：

- `vanilla-jui`
- `vanilla-signal`
- `vanilla-create-storage`
- `vanilla-signal-i18n`

## 配置

`runtime.inlineScript` 默认开启，不能关闭。公开配置只控制 `shared`，用于决定哪些本地 npm 依赖需要打包进 `runtime.js`，供页面脚本复用。
