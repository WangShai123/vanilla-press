# Highlight

Highlight is powered by `Shiki` and prerendered to static HTML during build.

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

Code highlighting is enabled by default and only runs during build.

Light mode uses the `GitHub Light Default` theme, and dark mode uses the `GitHub Dark Default` theme.

Customize themes with `build.highlight` in `vp/config/runtime.ts`:

```ts
export default {
  build: {
    highlight: {
      light: 'github-light-default',
      dark: 'github-dark-default',
    },
  },
}
```

If `light` or `dark` is missing, does not exist, or fails to load, the default theme is used.

## Supported Themes

Shiki provides dozens of themes. See the `Shiki` [official documentation](https://shiki.style/themes) for details.
