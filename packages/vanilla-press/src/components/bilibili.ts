import { escapeAttr } from '../utilities/markdown.ts'
import { toText } from '../utilities/string.ts'

export type BilibiliVideoId =
  | {
      key: 'bvid'
      value: string
    }
  | {
      key: 'aid'
      value: string
    }

export interface BilibiliIframeOptions {
  autoplay?: boolean
  t?: number
  muted?: boolean
  p?: number
  danmaku?: boolean
  noRelated?: boolean
}

export interface BilibiliEmbedOptions extends BilibiliIframeOptions {
  url: string
  width?: string
  height?: string
  ratio?: string
}

const DEFAULT_RATIO = '16 / 9'
const BOOLEAN_TRUE = new Set(['1', 'true', 'yes', 'on'])
const BOOLEAN_FALSE = new Set(['0', 'false', 'no', 'off'])
const RATIO_RE = /^\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?$/

function normalizeAttrValue(value: string | null): string {
  const text = toText(value).trim()
  if (!text) return ''

  const braceMatch = text.match(/^\{([\s\S]*)\}$/)
  return braceMatch ? braceMatch[1].trim() : text
}

function boolAttr(value: string | null, fallback = false): boolean {
  if (value === null) return fallback
  const normalized = normalizeAttrValue(value).toLowerCase()
  if (BOOLEAN_TRUE.has(normalized)) return true
  if (BOOLEAN_FALSE.has(normalized)) return false
  return fallback
}

function numberAttr(value: string | null, fallback: number): number {
  const normalized = normalizeAttrValue(value)
  const number = Number(normalized)
  return Number.isFinite(number) ? number : fallback
}

function positiveIntegerAttr(value: string | null, fallback: number): number {
  const number = Math.floor(numberAttr(value, fallback))
  return number > 0 ? number : fallback
}

function ratioAttr(value: string | null): string {
  const ratio = normalizeAttrValue(value) || DEFAULT_RATIO
  return RATIO_RE.test(ratio) ? ratio : DEFAULT_RATIO
}

export function extractBilibiliVideoId(url: string): BilibiliVideoId | null {
  if (typeof url !== 'string' || !url.trim()) return null

  let parsed: URL | null
  try {
    const normalized = url.startsWith('//') ? `https:${url}` : url
    parsed = new URL(normalized)
  } catch {
    parsed = null
  }

  const target = parsed ? parsed.pathname : url
  const bvMatch = target.match(/\/video\/(BV[0-9A-Za-z]+)/i)
  if (bvMatch) return { key: 'bvid', value: bvMatch[1] }

  const avMatch = target.match(/\/video\/av(\d+)/i)
  if (avMatch) return { key: 'aid', value: avMatch[1] }

  const fallbackBv = url.match(/(BV[0-9A-Za-z]{10})/)
  if (fallbackBv) return { key: 'bvid', value: fallbackBv[1] }

  const fallbackAv = url.match(/av(\d+)/i)
  if (fallbackAv) return { key: 'aid', value: fallbackAv[1] }

  return null
}

export function getBilibiliIframeSrc(
  url: string,
  options: BilibiliIframeOptions = {}
): string {
  const videoId = extractBilibiliVideoId(url)
  if (!videoId) {
    throw new Error(`Invalid Bilibili url: ${url}`)
  }

  const params = new URLSearchParams({
    isOutside: 'true',
    [videoId.key]: videoId.value,
    p: String(options.p ?? 1),
    autoplay: options.autoplay ? '1' : '0',
    muted: options.muted ? '1' : '0',
    danmaku: options.danmaku ? '1' : '0',
  })

  if (options.noRelated) params.set('no_related', '1')
  if (options.t && options.t > 0) params.set('t', String(options.t))

  return `//player.bilibili.com/player.html?${params.toString()}`
}

function optionsFromNode(node: Element): BilibiliEmbedOptions {
  const url =
    normalizeAttrValue(node.getAttribute('url')) ||
    node.textContent?.trim() ||
    ''

  return {
    url,
    autoplay: boolAttr(node.getAttribute('autoplay'), false),
    t: Math.max(0, numberAttr(node.getAttribute('t'), 0)),
    muted: boolAttr(node.getAttribute('muted'), false),
    p: positiveIntegerAttr(node.getAttribute('p'), 1),
    danmaku: boolAttr(node.getAttribute('danmaku'), false),
    noRelated: boolAttr(
      node.getAttribute('no-related') || node.getAttribute('norelated'),
      false
    ),
    width: normalizeAttrValue(node.getAttribute('width')) || '100%',
    height: normalizeAttrValue(node.getAttribute('height')),
    ratio: ratioAttr(
      node.getAttribute('ratio') ||
        node.getAttribute('aspect-ratio') ||
        node.getAttribute('aspectratio')
    ),
  }
}

export function renderBilibiliIframe(options: BilibiliEmbedOptions): string {
  const src = getBilibiliIframeSrc(options.url, options)
  const attrs = [
    `src="${escapeAttr(src)}"`,
    'scrolling="no"',
    'border="0"',
    'frameborder="no"',
    'framespacing="0"',
    'allowfullscreen="true"',
    `width="${escapeAttr(options.width || '100%')}"`,
  ]

  if (options.height) attrs.push(`height="${escapeAttr(options.height)}"`)
  attrs.push(
    `style="aspect-ratio: ${escapeAttr(options.ratio || DEFAULT_RATIO)};"`
  )

  return `<iframe ${attrs.join(' ')}></iframe>`
}

export function transformBilibiliTag(node: Element): void {
  const document = node.ownerDocument
  if (!document) return

  const template = document.createElement('template')
  template.innerHTML = renderBilibiliIframe(optionsFromNode(node))
  const iframe = template.content.firstElementChild
  if (iframe) node.replaceWith(iframe)
}
