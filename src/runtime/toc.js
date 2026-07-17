import { createToc } from 'vanilla-jui';

export function initToc() {
  const toc = document.querySelector('[data-doc-toc]');
  const article = document.querySelector('.j-content');
  if (!toc || !article || toc.dataset.docReady === 'true') return;

  if (!article.querySelector('h2, h3')) {
    toc.hidden = true;
    return;
  }

  createToc({
    container: toc,
    target: article,
    headings: 'h2, h3',
    offset: 80,
  }).build();
  toc.dataset.docReady = 'true';
}

