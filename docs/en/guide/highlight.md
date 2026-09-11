# Highlight

Highlight is powered by `highlight.js` and supports multiple languages.

## Example

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

## Runtime

In `vp/config/runtime.ts`, configure whether code highlighting is enabled.

```ts
export default {
  browser: {
    highlight: true,
  },
}
```

`highlight` defaults to `true`. Set it to `false` to disable code highlighting.

## Supported Languages

193 languages are supported. See the `highlight.js` [official documentation](https://highlightjs.org/) for details.
