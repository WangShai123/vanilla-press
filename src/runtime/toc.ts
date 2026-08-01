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

  createToc({
    container: toc,
    target: article,
    headings,
    offset,
  }).build();
  toc.dataset.docReady = 'true';
}
