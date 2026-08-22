import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

import { toText } from './string.ts'

const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)

export function escapeHtml(value: unknown): string {
  return toText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function cleanHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a',
      'abbr',
      'address',
      'audio',
      'b',
      'bdi',
      'blockquote',
      'br',
      'button',
      'caption',
      'cite',
      'code',
      'data',
      'dd',
      'del',
      'details',
      'dfn',
      'div',
      'dl',
      'dt',
      'em',
      'figcaption',
      'figure',
      'footer',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'header',
      'hr',
      'i',
      'iframe',
      'input',
      'ins',
      'img',
      'kbd',
      'li',
      'mark',
      'meter',
      'ol',
      'option',
      'p',
      'pre',
      'progress',
      'ruby',
      'rt',
      's',
      'samp',
      'select',
      'small',
      'span',
      'sub',
      'sup',
      'strong',
      'source',
      'summary',
      'table',
      'tbody',
      'td',
      'textarea',
      'th',
      'thead',
      'time',
      'tr',
      'u',
      'ul',
      'var',
      'video',
      'wbr',
    ],
    ALLOWED_ATTR: [
      'alt',
      'aria-expanded',
      'class',
      'controls',
      'cols',
      'datetime',
      'dir',
      'frameborder',
      'height',
      'hidden',
      'href',
      'id',
      'max',
      'min',
      'name',
      'open',
      'poster',
      'rel',
      'readonly',
      'rows',
      'scope',
      'size',
      'src',
      'style',
      'target',
      'title',
      'type',
      'value',
      'width',
    ],
    ALLOW_DATA_ATTR: true,
  })
}

export function htmlText(html: string): string {
  const dom = new JSDOM(`<main>${html}</main>`)
  return (dom.window.document.querySelector('main')?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeAttrValue(value: string | null): string {
  const text = String(value || '').trim()
  if (!text) return ''

  const braceMatch = text.match(/^\{([\s\S]*)\}$/)
  return braceMatch ? braceMatch[1].trim() : text
}

function parseGap(value: string | null): number {
  const normalized = normalizeAttrValue(value)
  const gap = Number(normalized || '8')
  return Number.isFinite(gap) ? gap : 8
}

function transformBadge(node: Element): void {
  const document = node.ownerDocument
  if (!document) return

  const badge = document.createElement('span')
  const theme = normalizeAttrValue(node.getAttribute('theme')) || 'default'
  const size = normalizeAttrValue(node.getAttribute('size')) || 'md'
  const text =
    normalizeAttrValue(node.getAttribute('text')) || node.textContent || ''

  badge.className = `j-badge is-${theme} is-${size}`
  badge.textContent = text
  node.replaceWith(badge)
}

function transformGroup(node: Element): void {
  const document = node.ownerDocument
  if (!document) return

  const group = document.createElement('div')
  group.className = 'vp-group'
  group.style.display = 'flex'
  group.style.gap = `${parseGap(node.getAttribute('gap'))}px`

  while (node.firstChild) {
    group.appendChild(node.firstChild)
  }

  node.replaceWith(group)
}

export function transformComponentTags(html: string): string {
  if (!/<(?:\/?)(?:Badge|badge|Group|group)\b/.test(html)) return html

  const normalized = html.replace(/<(Badge|badge)([^>]*)\/>/g, '<$1$2></$1>')
  const dom = new JSDOM(`<main>${normalized}</main>`)
  const document = dom.window.document
  const main = document.querySelector('main')
  if (!main) return html

  for (const node of Array.from(main.querySelectorAll('badge'))) {
    transformBadge(node)
  }

  for (const node of Array.from(main.querySelectorAll('group'))) {
    transformGroup(node)
  }

  return main.innerHTML || html
}
