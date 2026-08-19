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

In `vp/config/runtime.ts`, configure whether code highlighting is enabled and which languages can be built. `vanilla-press` uses `highlight.js` core and only registers the language modules listed in `browser.highlight.languages`.

```ts
export default {
  browser: {
    highlight: {
      enabled: true,
      languages: [
        { value: 'plaintext', label: 'Plain Text' },
        { value: 'bash', label: 'Bash' },
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'html', label: 'HTML' },
        { value: 'css', label: 'CSS' },
        { value: 'json', label: 'JSON' },
        { value: 'markdown', label: 'Markdown' },
      ],
    },
  },
}
```

`highlight: false` or `highlight: { enabled: false }` disables code highlighting. When `languages` is omitted, the default language list is used. When it is configured, only the listed languages are supported, which keeps language module loading scoped to the project.

## Default Languages

The default supported languages are:

```ts
;[
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'bash', label: 'Bash' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'css', label: 'CSS' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'go', label: 'Go' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'html', label: 'HTML' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'php', label: 'PHP' },
  { value: 'python', label: 'Python' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'swift', label: 'Swift' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
]
```

More languages are supported. Please refer to the `highlight.js` [official documentation](https://highlightjs.org/).
