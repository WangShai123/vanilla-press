# 代码高亮

基于 `highlight.js` 的代码高亮，支持多种语言。

## 示例

```js
const pages = ['index.md', 'guide/components.md'];

export function toHtml(file) {
  return file.replace(/\.md$/, '.html');
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

在 `vp/config/config.ts` 中，按需配置是否启用代码高亮功能，以及允许构建的语言列表。`vanilla-press` 基于 `highlight.js` core，只会注册 `runtime.highlight.languages` 中配置的语言模块。

```javascript
export default {
  runtime: {
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
};
```

`highlight: false` 或 `highlight: { enabled: false }` 会关闭代码高亮。未配置 `languages` 时使用默认语言列表；配置后仅支持列表中的语言，适合减少按需加载的语言模块。

## 支持语言

默认支持以下语言：

```javascript
[
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
];
```

更多语言支持请参考 `highlight.js` [官方文档](https://highlightjs.org/)。
