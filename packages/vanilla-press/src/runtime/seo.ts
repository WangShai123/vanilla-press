import { q } from 'vanilla-jui';
import { jsx } from 'vanilla-signal';

import type { DocConfig, RuntimePage } from '../types.ts';
import { isSeoEnabled } from '../utilities/features.ts';
import { documentTitle } from '../utilities/page.ts';
import { toText } from '../utilities/string.ts';

function pageTitle(config: DocConfig = {}, page: RuntimePage = {}): string {
  return documentTitle(page.seo?.title || page.title, config, page.rel);
}

function syncMeta(name: string, content: unknown): void {
  const value = toText(content).trim();
  let meta = q<HTMLMetaElement>(`meta[data-vp-seo="${name}"]`);

  if (!value) {
    meta?.remove();
    return;
  }

  if (!meta) {
    meta = jsx('meta', {
      name,
      'data-vp-seo': name,
    }) as HTMLMetaElement;
    document.head.append(meta);
  }

  meta.content = value;
}

export function initSeo(config: DocConfig = {}, page: RuntimePage = {}): void {
  if (!isSeoEnabled(config)) return;

  document.title = pageTitle(config, page);
  syncMeta('keywords', page.seo?.keywords);
  syncMeta('description', page.seo?.description);
}
