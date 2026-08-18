import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

import { toText } from './string.ts';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export function escapeHtml(value: unknown): string {
  return toText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function cleanHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a',
      'blockquote',
      'br',
      'button',
      'code',
      'del',
      'details',
      'div',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'img',
      'li',
      'ol',
      'p',
      'pre',
      'span',
      'strong',
      'summary',
      'table',
      'tbody',
      'td',
      'th',
      'thead',
      'tr',
      'ul',
    ],
    ALLOWED_ATTR: [
      'alt',
      'aria-expanded',
      'class',
      'hidden',
      'href',
      'id',
      'open',
      'rel',
      'src',
      'style',
      'target',
      'type',
    ],
    ALLOW_DATA_ATTR: true,
  });
}

export function htmlText(html: string): string {
  const dom = new JSDOM(`<main>${html}</main>`);
  return (dom.window.document.querySelector('main')?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
}
