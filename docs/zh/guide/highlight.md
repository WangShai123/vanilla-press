# 代码高亮

基于 `highlight.js` 的代码高亮，支持多种语言。

## 示例

```js
const pages = ['index.md', 'guide/components.md']

export function toHtml(file) {
  return file.replace(/\.md$/, '.html')
}
```

```php
<?php
namespace App;
use DI\ContainerBuilder;

class Test
{
  private ContainerBuilder $builder;

  public function __construct()
  {
    parent::__construct();
    $this->builder = new ContainerBuilder();
  }

  public function getContainer()
  {
    $this->builder->addDefinitions(config('dependence', []));
    $this->builder->useAutowiring(true);
    $this->builder->useAttributes(true);

    return $this->builder->build();
  }
}
```

## 运行时

在 `vp/config/runtime.ts` 中，按需配置是否启用代码高亮功能。

```ts
export default {
  browser: {
    highlight: true,
  },
}
```

`highlight` 默认为 `true`。设置为 `false` 时，会关闭代码高亮。

## 支持语言

支持 193 种语言，详情参考 `highlight.js` [官方文档](https://highlightjs.org/)。
