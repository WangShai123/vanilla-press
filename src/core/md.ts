import MarkdownIt from 'markdown-it';
import type { MarkdownIt as MarkdownItType } from 'markdown-it';
import anchor from 'markdown-it-anchor';
import attrs from 'markdown-it-attrs';
import frontMatter from 'markdown-it-front-matter';

import { installAccordion } from '../components/accordion.ts';
import { installOffcanvas } from '../components/offcanvas.ts';
import { installTabs } from '../components/tabs.ts';
import { installTip } from '../components/tip.ts';
import { installTree } from '../components/tree.ts';
import { createHighlighter } from '../runtime/highlight.ts';
import type { DocConfig } from '../types.ts';
import { isHighlightEnabled } from '../utilities/features.ts';
import { escapeHtml } from '../utilities/html.ts';

type MarkdownHighlighter = (
  code: string,
  lang: string,
  attrs: string
) => string;

function renderPlainCode(code: string, lang: string): string {
  const language = String(lang || '').trim();
  const suffix = language ? ` class="language-${language}"` : '';
  return `<pre><code${suffix}>${escapeHtml(code)}</code></pre>`;
}

export function createMarkdown(config: DocConfig = {}): MarkdownItType {
  const highlighter: MarkdownHighlighter = isHighlightEnabled(config)
    ? (createHighlighter(config) as MarkdownHighlighter)
    : renderPlainCode;
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: highlighter,
  });

  md.use(frontMatter, () => {});
  md.use(attrs);
  md.use(anchor, {
    level: [2, 3],
    permalinkSymbol: '#',
  });
  installTabs(md);
  installAccordion(md);
  installOffcanvas(md);
  installTip(md);
  installTree(md);

  return md;
}

const md = createMarkdown();

export default md;
