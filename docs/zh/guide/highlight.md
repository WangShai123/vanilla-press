# 代码高亮

基于 `Shiki` 的代码高亮，构建时预渲染为静态 HTML。

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

    return $this->builder->server();
  }
}
```

## 运行时

代码高亮是默认构建功能，仅在构建阶段运行。

浅色模式使用 `GitHub Light Default` 主题，深色模式使用 `GitHub Dark Default` 主题。

可通过 `vp/config/runtime.ts` 的 `server.highlight` 自定义主题：

```ts
export default {
  server: {
    highlight: {
      light: 'github-light-default',
      dark: 'github-dark-default',
    },
  },
}
```

`light` 或 `dark` 缺失、主题不存在或加载失败时，会使用默认主题。

## 支持主题

Shiki 提供了数十种主题，详情参考 `Shiki` [官方文档](https://shiki.style/themes)。
