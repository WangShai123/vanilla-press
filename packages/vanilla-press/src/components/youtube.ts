import { escapeAttr } from '../utilities/markdown.ts'
import { toText } from '../utilities/string.ts'

export interface YoutubeIframeOptions {
  autoplay?: boolean
  controls?: boolean
  end?: number
  loop?: boolean
  muted?: boolean
  noRelated?: boolean
  start?: number
}

export interface YoutubeEmbedOptions extends YoutubeIframeOptions {
  url: string
  width?: string
  height?: string
  ratio?: string
}

const DEFAULT_RATIO = '16 / 9'
const BOOLEAN_TRUE = new Set(['1', 'true', 'yes', 'on'])
const BOOLEAN_FALSE = new Set(['0', 'false', 'no', 'off'])
const RATIO_RE = /^\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?$/
const VIDEO_ID_RE = /^[0-9A-Za-z_-]{11}$/

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

function ratioAttr(value: string | null): string {
  const ratio = normalizeAttrValue(value) || DEFAULT_RATIO
  return RATIO_RE.test(ratio) ? ratio : DEFAULT_RATIO
}

function normalizeVideoId(value: string | null): string | null {
  const id = normalizeAttrValue(value)
  return VIDEO_ID_RE.test(id) ? id : null
}

export function extractYoutubeVideoId(url: string): string | null {
  if (typeof url !== 'string' || !url.trim()) return null

  const directId = normalizeVideoId(url)
  if (directId) return directId

  let parsed: URL | null
  try {
    const normalized = url.startsWith('//') ? `https:${url}` : url
    parsed = new URL(normalized)
  } catch {
    parsed = null
  }

  if (parsed) {
    const queryId = normalizeVideoId(parsed.searchParams.get('v'))
    if (queryId) return queryId

    const [, firstSegment, secondSegment] = parsed.pathname.split('/')
    if (['embed', 'shorts', 'live'].includes(firstSegment)) {
      return normalizeVideoId(secondSegment)
    }

    if (parsed.hostname === 'youtu.be') {
      return normalizeVideoId(firstSegment)
    }
  }

  const fallback = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed|shorts|live)\/|[?&]v=)([0-9A-Za-z_-]{11})/
  )
  return fallback ? fallback[1] : null
}

export function getYoutubeIframeSrc(
  url: string,
  options: YoutubeIframeOptions = {}
): string {
  const videoId = extractYoutubeVideoId(url)
  if (!videoId) {
    throw new Error(`Invalid Youtube url: ${url}`)
  }

  const params = new URLSearchParams({
    autoplay: options.autoplay ? '1' : '0',
    controls: options.controls === false ? '0' : '1',
    mute: options.muted ? '1' : '0',
  })

  if (options.loop) {
    params.set('loop', '1')
    params.set('playlist', videoId)
  }

  if (options.noRelated) params.set('rel', '0')
  if (options.start && options.start > 0)
    params.set('start', String(options.start))
  if (options.end && options.end > 0) params.set('end', String(options.end))

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

function optionsFromNode(node: Element): YoutubeEmbedOptions {
  const url =
    normalizeAttrValue(node.getAttribute('url')) ||
    normalizeAttrValue(node.getAttribute('id')) ||
    node.textContent?.trim() ||
    ''

  return {
    url,
    autoplay: boolAttr(node.getAttribute('autoplay'), false),
    controls: boolAttr(node.getAttribute('controls'), true),
    end: Math.max(0, numberAttr(node.getAttribute('end'), 0)),
    loop: boolAttr(node.getAttribute('loop'), false),
    muted: boolAttr(node.getAttribute('muted'), false),
    noRelated: boolAttr(
      node.getAttribute('no-related') || node.getAttribute('norelated'),
      false
    ),
    start: Math.max(
      0,
      numberAttr(node.getAttribute('start') || node.getAttribute('t'), 0)
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

export function renderYoutubeIframe(options: YoutubeEmbedOptions): string {
  const src = getYoutubeIframeSrc(options.url, options)
  const attrs = [
    `src="${escapeAttr(src)}"`,
    'title="YouTube video player"',
    'frameborder="0"',
    'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"',
    'referrerpolicy="strict-origin-when-cross-origin"',
    'allowfullscreen="true"',
    `width="${escapeAttr(options.width || '100%')}"`,
  ]

  if (options.height) attrs.push(`height="${escapeAttr(options.height)}"`)
  attrs.push(
    `style="aspect-ratio: ${escapeAttr(options.ratio || DEFAULT_RATIO)};"`
  )

  return `<iframe ${attrs.join(' ')}></iframe>`
}

export function transformYoutubeTag(node: Element): void {
  const document = node.ownerDocument
  if (!document) return

  const template = document.createElement('template')
  template.innerHTML = renderYoutubeIframe(optionsFromNode(node))
  const iframe = template.content.firstElementChild
  if (iframe) node.replaceWith(iframe)
}
