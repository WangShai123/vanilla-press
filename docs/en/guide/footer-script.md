# Footer Script

Footer script lets a site inject one shared JavaScript snippet into every generated page.

During build, `vanilla-press` reads the default export from `vp/config/footerScript.ts` and writes it at the bottom of each HTML page body.

## Configuration

Configure the script tag type in `vp/config/config.ts`:

```typescript
export default {
  runtime: {
    footerScript: 'script',
  },
};
```

`runtime.footerScript` accepts two values:

| Value    | Output                               | Description                   |
| -------- | ------------------------------------ | ----------------------------- |
| `script` | `<script>...</script>`               | Default, a classic script tag |
| `module` | `<script type="module">...</script>` | ES Module script mode         |

## Script Content

Write the script content in `vp/config/footerScript.ts`:

```typescript
import type { FooterScriptConfig } from 'vanilla-press';

export default `
console.log('site footer script loaded');
` satisfies FooterScriptConfig;
```

After build, every page includes:

```html
<script>
  console.log('site footer script loaded');
</script>
```

If `vp/config/footerScript.ts` exports an empty string, no script tag is emitted.

## Use Cases

Footer script is useful for site-wide code such as analytics, tracking, conversion tags, or global initialization.

For example, Google Analytics:

```typescript
import type { FooterScriptConfig } from 'vanilla-press';

export default `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX');
` satisfies FooterScriptConfig;
```

If the analytics provider requires an external SDK, create a `script` element dynamically inside the snippet, or set `runtime.footerScript: 'module'` for module script code.
