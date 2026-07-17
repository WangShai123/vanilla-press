# 组件开发 API

本文档面向组件维护者，说明 `vanilla-press` 组件体系的运行机制、开发约定与扩展方式。

## 设计特点

### 1. 编译期与运行期分离

- 编译期：`markdown-it` 将容器语法渲染成带 `data-*` 标记的 HTML。
- 运行期：`initDocPage()` 扫描页面并初始化组件交互。
- 优点：静态输出可直接部署，运行时只做最小交互增强。

### 2. 依赖图驱动初始化（拓扑排序）

运行时组件通过注册表声明依赖关系，按拓扑顺序初始化，而不是硬编码固定顺序。

- 典型依赖：`accordion`、`offcanvas` 依赖 `tabs`。
- 结果：当组件互相嵌套时，先确保容器类组件（如 tabs）成型，再初始化其内部组件。

### 3. 多轮收敛初始化

组件初始化不是只跑一轮，而是按顺序多轮执行，直到没有新的可初始化节点。

- 适合处理“先初始化 A，A 再生成 B 的 DOM”这种链式场景。
- 每个组件都必须是幂等初始化（见后文规范）。

### 4. 动态 DOM 自动补初始化

运行时监听 DOM 新增节点，一旦发现新的 `data-doc-component`，会自动触发补初始化。

- 适合 tabs 切换重建、异步插入、未来懒加载组件等场景。

## 设计规范

- 组件容器统一使用 `:::组件名` 开头，必须用独立一行 `:::` 结束。
- 在 `:::tabs` 内嵌套其他组件时，子组件必须完整写在某个 `@tab` 面板内容里，不能放在 tabs 结束标记之后。
- 组件参数统一采用“空白分词 + 方括号标题”规则：方括号用于标题文本，裸单词用于布尔或枚举参数。
- 每个组件渲染时都要写入 `data-doc-component`，并在初始化完成后标记 `data-doc-ready="true"`，保证幂等。
- 新增组件时需要同时补齐三部分：Markdown 解析与渲染、前端 `init` 初始化函数、组件文档中的“示例 + 语法 + 参数说明”。

## 组件开发 API

### 1. 组件模块约定

每个组件建议放在 `src/components/<name>.js`，并导出两个核心函数：

- `install<Name>(md)`：注册 Markdown 容器语法与渲染规则。
- `init<Name>(root = document)`：在运行时扫描并初始化页面节点。

推荐结构：

```javascript
export function installXxx(md) {
  // 注册 block 规则
  // 写入 renderer 规则
}

export function initXxx(root = document) {
  // 扫描 data-doc-component
  // 跳过 data-doc-ready=true
  // 绑定事件/构建组件
  // 标记 data-doc-ready=true
}
```

### 2. Markdown 解析层 API

可复用工具函数（`src/components/utils.js`）：

- `readContainer(state, startLine, endLine)`：读取 `:::` 容器内容，支持嵌套容器与代码围栏。
- `parseBracketTitle(info)`：解析方括号标题，如 `[打开抽屉]`。
- `parseFlag(info, name)`：解析布尔标记词，如 `multiple`、`collapsible`。
- `splitMarkedBlocks(content, marker, fallbackTitle)`：按标记（如 `@tab` / `@item`）切分内容。
- `markComponent(env, name)`：记录页面用到的组件名，供构建阶段注入初始化列表。

### 3. HTML 输出约定

渲染器输出需遵守以下约定：

- 根节点必须包含 `data-doc-component="<name>"`。
- 子节点使用稳定 `data-*` 标记，供 `init<Name>` 查询。
- 参数结果落地为 `data-*`，避免运行时重复解析 Markdown 原文。

示例：

```html
<div data-doc-component="accordion" data-multiple="true">
  <div data-doc-accordion-item data-title="标题">...</div>
</div>
```

### 4. 运行时初始化 API

运行时入口 `initDocPage(options)` 会：

- 读取构建注入的 `components` 列表。
- 根据注册表自动展开依赖。
- 按拓扑排序执行组件初始化。
- 多轮执行直到收敛。
- 监听动态新增节点并补初始化。

组件作者只需保证 `init<Name>` 的幂等性和局部扫描能力，无需手动处理全局顺序。

### 5. 幂等与边界规则

`init<Name>` 必须满足：

- 可重复调用：已初始化节点必须被跳过。
- 仅处理 `root` 范围内节点：避免跨区域副作用。
- 缺少必要子节点时安全返回：不抛异常、不污染状态。

## 新增组件流程（Checklist）

1. 在 `src/components/` 新建组件模块，完成 `install<Name>` 与 `init<Name>`。
2. 在 Markdown 创建器中安装 `install<Name>`。
3. 在运行时注册表中注册组件及依赖关系。
4. 在文档中新增组件页面内容：示例、语法、参数说明。
5. 如果需要导航入口，同步更新 `docs/sidebar.js`、`docs/menu.js` 与 `docs/languages.js`。

## 常见嵌套场景建议

- tabs 内放 accordion/offcanvas：依赖声明为 `dependsOn: ["tabs"]`。
- accordion 项内再放 tabs：无需特殊分支，保持组件幂等即可。
- 未来异步插入内容：确保插入的根元素带 `data-doc-component`，运行时会自动补初始化。
