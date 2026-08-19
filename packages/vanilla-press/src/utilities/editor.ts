import { format as formatDate } from 'date-fns'
import { JSDOM } from 'jsdom'

import icons from '../config/icons.ts'
import { createDocI18n } from '../runtime/i18n.ts'
import type {
  RuntimeConfig,
  LanguagesConfig,
  RuntimePage,
  UnknownRecord,
} from '../types.ts'
import { isRecord } from '../types.ts'
import { buildOption } from './features.ts'
import { toText } from './string.ts'

export const DEFAULT_EDIT_LINK_PATTERN =
  'https://github.com/WangShai123/vanilla-press/edit/main/docs/:path'
export const DEFAULT_EDIT_LINK_TEXT = 'editor.editLink'
export const DEFAULT_LAST_EDIT_TEXT = 'editor.lastUpdated'
export const DEFAULT_LAST_EDIT_FORMAT = 'yyyy-MM-dd HH:mm:ss'

interface EditorLinkConfig extends UnknownRecord {
  pattern?: string
  text?: unknown
}

interface EditorLastEditConfig extends UnknownRecord {
  text?: unknown
  format?: string
  utc?: boolean
}

const PROTECTED_DATE_FNS_TOKENS =
  /(^|[^A-Za-z])(?:Y{2,4}|D{1,2})(?=$|[^A-Za-z])/

function formatUtcOffset(date: Date): string {
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60
  if (minutes === 0) return `UTC${sign}${hours}`
  return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`
}

function plainObject(value: unknown): UnknownRecord | null {
  return isRecord(value) ? (value as UnknownRecord) : null
}

function markdownPath(rel: unknown = ''): string {
  return toText(rel)
    .replace(/\.html$/i, '.md')
    .replace(/^\/+/, '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
}

function localizedText(
  value: unknown,
  i18n: ReturnType<typeof createDocI18n>,
  fallback: string
): string {
  if (value === false || value === null || value === undefined) return ''

  const record = plainObject(value)
  if (record) {
    const translated =
      record[i18n.getLocale()] ?? record[i18n.getFallbackLocale()]
    return toText(translated || Object.values(record)[0]).trim() || fallback
  }

  const text = toText(value).trim()
  if (!text) return fallback

  const translated = i18n.t(text)
  return translated && translated !== text ? translated : fallback || text
}

export function formatLastEditDate(
  value: Date | number | string,
  format = DEFAULT_LAST_EDIT_FORMAT,
  utc = true
): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pattern = String(format || DEFAULT_LAST_EDIT_FORMAT)
  const formatted = PROTECTED_DATE_FNS_TOKENS.test(pattern)
    ? formatDate(date, DEFAULT_LAST_EDIT_FORMAT)
    : (() => {
        try {
          return formatDate(date, pattern)
        } catch {
          return formatDate(date, DEFAULT_LAST_EDIT_FORMAT)
        }
      })()

  return utc ? `${formatted} ${formatUtcOffset(date)}` : formatted
}

function createIcon(document: Document): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'el-icon')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.innerHTML = String(icons.edit || '')
  return svg
}

function resolveEditLinkConfig(value: unknown): EditorLinkConfig | null {
  if (value === false || value === null || value === undefined) return null
  if (value === true) return {}
  return plainObject(value) as EditorLinkConfig | null
}

function resolveLastEditConfig(value: unknown): EditorLastEditConfig | null {
  if (value === false || value === null || value === undefined) return null
  if (value === true) return {}
  return plainObject(value) as EditorLastEditConfig | null
}

function resolveEditLinkPattern(
  config: EditorLinkConfig | null,
  page: RuntimePage = {}
): string {
  const pattern = toText(config?.pattern).trim() || DEFAULT_EDIT_LINK_PATTERN
  return pattern.replace(/:path\b/g, markdownPath(page.rel))
}

function resolveEditorHelp(
  config: RuntimeConfig = {},
  languages: LanguagesConfig = {},
  page: RuntimePage = {}
): {
  editLink?: EditorLinkConfig | null
  lastEdit?: EditorLastEditConfig | null
  i18n: ReturnType<typeof createDocI18n>
} {
  return {
    editLink: resolveEditLinkConfig(buildOption(config, 'editLink')),
    lastEdit: resolveLastEditConfig(buildOption(config, 'lastEdit')),
    i18n: createDocI18n(languages, page),
  }
}

function createEditLink(
  document: Document,
  config: EditorLinkConfig | null,
  i18n: ReturnType<typeof createDocI18n>,
  page: RuntimePage = {}
): HTMLElement | null {
  if (!config) return null

  const href = resolveEditLinkPattern(config, page)
  if (!href) return null

  const link = document.createElement('a')
  link.href = href
  link.target = '_blank'
  link.rel = 'noreferrer noopener'

  const icon = createIcon(document)
  const text = document.createElement('span')
  text.textContent = localizedText(config.text, i18n, DEFAULT_EDIT_LINK_TEXT)

  link.append(icon, text)

  const wrapper = document.createElement('div')
  wrapper.className = 'vp-edit-link'
  wrapper.append(link)
  return wrapper
}

function createLastEdit(
  document: Document,
  config: EditorLastEditConfig | null,
  i18n: ReturnType<typeof createDocI18n>,
  lastEditText: string
): HTMLElement | null {
  if (!config || !lastEditText) return null

  const wrapper = document.createElement('div')
  wrapper.className = 'vp-edit-time'

  const label = document.createElement('span')
  label.textContent = localizedText(config.text, i18n, DEFAULT_LAST_EDIT_TEXT)

  const value = document.createElement('span')
  value.textContent = lastEditText

  wrapper.append(label, document.createTextNode(' '), value)
  return wrapper
}

function createEditorHelpContainer(
  document: Document,
  config: RuntimeConfig = {},
  languages: LanguagesConfig = {},
  page: RuntimePage = {},
  lastEditText = ''
): HTMLElement | null {
  const { editLink, lastEdit, i18n } = resolveEditorHelp(
    config,
    languages,
    page
  )

  const container = document.createElement('div')
  container.className = 'vp-editor-help'

  const editLinkNode = createEditLink(document, editLink ?? null, i18n, page)
  const lastEditNode = createLastEdit(
    document,
    lastEdit ?? null,
    i18n,
    lastEditText
  )

  if (editLinkNode) container.append(editLinkNode)
  if (lastEditNode) container.append(lastEditNode)
  if (!container.childNodes.length) return null

  return container
}

export function injectEditorHelp(
  body = '',
  page: RuntimePage = {},
  config: RuntimeConfig = {},
  languages: LanguagesConfig = {},
  lastEditText = ''
): string {
  const dom = new JSDOM(`<main>${body}</main>`)
  const document = dom.window.document
  const h1 = document.querySelector('main > h1')
  if (!h1) return body

  const container = createEditorHelpContainer(
    document,
    config,
    languages,
    page,
    lastEditText
  )
  if (!container) return body

  h1.insertAdjacentElement('afterend', container)
  return document.querySelector('main')?.innerHTML || body
}

export function renderEditorHelp(
  page: RuntimePage = {},
  config: RuntimeConfig = {},
  languages: LanguagesConfig = {},
  lastEditText = ''
): string {
  const dom = new JSDOM('<div></div>')
  const document = dom.window.document
  const container = createEditorHelpContainer(
    document,
    config,
    languages,
    page,
    lastEditText
  )
  return container?.outerHTML || ''
}
