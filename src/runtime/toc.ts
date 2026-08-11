import { createToc, q } from 'vanilla-jui';

import type { DocConfig } from '../types.ts';
import { tocOptions } from '../utilities/features.ts';

export function initToc(config: DocConfig = {}): void {
  const toc = q<HTMLElement>('[data-doc-toc]');
  const article = q<HTMLElement>('.j-content');
  if (!toc || !article || toc.dataset.docReady === 'true') return;

  const { headings, offset } = tocOptions(config);
  if (!q(headings, article)) {
    toc.hidden = true;
    return;
  }

  toc.textContent = '';
  const instance = createToc({
    target: article,
    headings,
    offset,
  });
  instance.mount(toc);
  toc.dataset.docReady = 'true';
}
