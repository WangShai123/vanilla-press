# 内联脚本

`inline-script` 用于在某个 Markdown 页面内编写当前页面专用的 JavaScript。

构建时，`vanilla-press` 会把 `vp-script` 代码块从正文中移除，合并为一个独立的页面脚本文件，并只在当前页面 HTML 中引用。

## 示例

<button data-demo-button class="j-button is-outline">点击我</button>

```vp-script
import { Toast } from 'vanilla-jui';

const button = document.querySelector('[data-demo-button]');

button?.addEventListener('click', () => {
  console.log('clicked');
  Toast.primary('嗨，你成功地点击了我');
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
dist/zh/guide/api.xxxxxxxx.js
```

当前页面 HTML 会自动引用它：

```html
<script type="module" src="./api.xxxxxxxx.js"></script>
```

其他页面不会引用这份脚本。

## 执行时机

页面脚本会作为 `type="module"` 脚本插入到页面运行时之后。

因此脚本可以访问当前页面 DOM，并适合绑定仅属于当前页面的交互逻辑。

## 使用共享依赖

在 `vp-script` 中可以直接使用静态 `import` 引入 `vanilla-press` 已经依赖的运行时包：

````markdown
```vp-script
import { Toast } from 'vanilla-jui';

const button = document.querySelector('[data-demo-button]');

button?.addEventListener('click', () => {
  Toast.show('clicked');
});
```
````

以下依赖会被复用到全局 `runtime.js`，页面脚本不会重复打包它们：

- `vanilla-jui`
- `vanilla-signal`
- `vanilla-create-storage`
- `vanilla-signal-i18n`

构建时会自动改写这些导入，并在当前页面加入 import map。作者不需要手写 import map。

其他第三方依赖不进入 `runtime.js`，只会打包进当前页面自己的 `api.xxxxxxxx.js` 等页面脚本文件。

## 配置

`runtime.inlineScript` 是内部运行时能力，默认开启，不对外暴露配置项，也不能关闭。
