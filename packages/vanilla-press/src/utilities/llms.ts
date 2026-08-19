import { JSDOM } from 'jsdom'

import type { DocConfig, LanguagesConfig, UnknownRecord } from '../types.ts'
import { isRecord } from '../types.ts'
import { llmsOptions, type LlmsRuntimeOptions } from './features.ts'
import { toText } from './string.ts'

interface RoutePage {
  rel?: string
}

interface LlmsLabels extends UnknownRecord {
  link?: string
  copy?: string
  chatgpt?: string
  claude?: string
  options?: string
}

type LlmsLabelsMap = Record<string, LlmsLabels>

interface LlmsConfig extends UnknownRecord {
  title?: unknown
  description?: unknown
  sectionTitle?: unknown
  container?: {
    labels?: unknown
  } & UnknownRecord
}

export const DEFAULT_LLMS_CONTAINER_LABELS: LlmsLabelsMap = {
  'zh-CN': {
    link: '查看 Markdown',
    copy: '复制 Markdown 链接',
    chatgpt: '在 ChatGPT 中打开',
    claude: '在 Claude 中打开',
    options: 'LLMs',
  },
  en: {
    link: 'View Markdown',
    copy: 'Copy Markdown link',
    chatgpt: 'Open in ChatGPT',
    claude: 'Open in Claude',
    options: 'LLMs',
  },
}

function cleanValue(value: unknown): string | null {
  if (value === false || value === undefined || value === null) return null
  const text = toText(value).trim()
  return text || null
}

function baseUrl(siteUrl: unknown): string {
  const value = cleanValue(siteUrl)
  return value ? value.replace(/\/+$/g, '') : ''
}

function encodeRoute(route: unknown): string {
  return toText(route)
    .replace(/^\/+/, '')
    .split('/')
    .map(encodeURIComponent)
    .join('/')
}

function normalizeRel(value = ''): string {
  return toText(value).replace(/^\/+/, '').replace(/\/+/g, '/')
}

function localeCode(value = ''): string {
  return toText(value).trim().toLowerCase()
}

function asLabels(value: unknown): LlmsLabels {
  return isRecord(value) ? (value as LlmsLabels) : {}
}

function asLabelsMap(value: unknown): LlmsLabelsMap {
  return isRecord(value) ? (value as LlmsLabelsMap) : {}
}

export function markdownRouteRel(page: RoutePage = {}): string {
  return String(page.rel || '').replace(/\.html$/i, '.md')
}

export function markdownRouteUrl(
  page: RoutePage = {},
  siteConfig: DocConfig = {}
): string {
  const base = baseUrl(siteConfig.siteUrl)
  const route = encodeRoute(markdownRouteRel(page))
  return base ? `${base}/${route}` : route
}

export function renderLlmsTxt(
  config: LlmsConfig = {},
  siteConfig: DocConfig = {},
  pages: RoutePage[] = []
): string {
  const title =
    cleanValue(config.title) || cleanValue(siteConfig.siteName) || 'Docs'
  const description = cleanValue(config.description)
  const sectionTitle = cleanValue(config.sectionTitle) || 'Docs'
  const lines = [`# ${title}`]

  if (description) {
    lines.push('', description)
  }

  lines.push('', `## ${sectionTitle}`)

  for (const page of pages) {
    lines.push(`- ${markdownRouteUrl(page, siteConfig)}`)
  }

  return `${lines.join('\n').trim()}\n`
}

function hasVisibleControls(options: LlmsRuntimeOptions): boolean {
  return Boolean(
    options.enabled &&
    (options.link || options.copy || options.chatgpt || options.claude)
  )
}

function pageLocaleCode(
  languages: LanguagesConfig = {},
  page: RoutePage = {}
): string {
  const locales = Array.isArray(languages.locales) ? languages.locales : []
  const rel = normalizeRel(page.rel || 'index.html')
  const sorted = [...locales].sort(
    (a, b) => normalizeRel(b.path).length - normalizeRel(a.path).length
  )
  const matched = sorted.find((locale) => {
    const prefix = normalizeRel(locale.path)
    return (
      prefix && (rel === `${prefix}/index.html` || rel.startsWith(`${prefix}/`))
    )
  })

  return matched?.code || languages.locale || languages.fallbackLocale || 'en'
}

function localeLabels(labels: LlmsLabelsMap = {}, locale: string): LlmsLabels {
  const key = String(locale || '')
  const lowerKey = localeCode(key)

  return (
    labels[key] ||
    Object.entries(labels).find(
      ([candidate]) => localeCode(candidate) === lowerKey
    )?.[1] ||
    labels.en ||
    labels['zh-CN'] ||
    asLabels(Object.values(labels).find(isRecord)) ||
    {}
  )
}

export function llmsContainerLabels(
  config: LlmsConfig = {},
  languages: LanguagesConfig = {},
  page: RoutePage = {}
): Required<
  Pick<LlmsLabels, 'link' | 'copy' | 'chatgpt' | 'claude' | 'options'>
> {
  const configuredLabels = asLabelsMap(config.container?.labels)
  const labels = {
    ...DEFAULT_LLMS_CONTAINER_LABELS,
    ...configuredLabels,
  }
  const locale = pageLocaleCode(languages, page)
  const defaults = localeLabels(DEFAULT_LLMS_CONTAINER_LABELS, locale)
  const selected = localeLabels(labels, locale)

  return {
    link: cleanValue(selected.link) || String(defaults.link || ''),
    copy: cleanValue(selected.copy) || String(defaults.copy || ''),
    chatgpt: cleanValue(selected.chatgpt) || String(defaults.chatgpt || ''),
    claude: cleanValue(selected.claude) || String(defaults.claude || ''),
    options: cleanValue(selected.options) || String(defaults.options || ''),
  }
}

function setBooleanData(element: Element, name: string, value: boolean): void {
  element.setAttribute(name, value ? 'true' : 'false')
}

function createIconSlot(document: Document, name: string): HTMLSpanElement {
  const slot = document.createElement('span')
  slot.className = 'el-prefix'
  slot.setAttribute('data-vp-llms-icon', name)
  return slot
}

function createButtonText(document: Document, text: string): HTMLSpanElement {
  const span = document.createElement('span')
  span.className = 'button-text'
  span.textContent = text
  return span
}

function createLinkButton(
  document: Document,
  labels: LlmsLabels
): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'j-button is-default'
  button.setAttribute('data-vp-llms-link', '')
  button.append(
    createIconSlot(document, 'file'),
    createButtonText(document, String(labels.link || ''))
  )
  return button
}

function createOptionsButton(
  document: Document,
  labels: LlmsLabels
): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'j-button is-default is-icon llms-options-trigger'
  button.setAttribute('data-vp-llms-options-trigger', '')
  button.setAttribute('aria-label', String(labels.options || ''))
  button.append(createIconSlot(document, 'arrow-down'))
  return button
}

function createLlmsContainer(
  document: Document,
  page: RoutePage = {},
  siteConfig: DocConfig = {},
  llmsConfig: LlmsConfig = {},
  languages: LanguagesConfig = {}
): HTMLDivElement | null {
  const options = llmsOptions(siteConfig)
  if (!hasVisibleControls(options)) return null

  const labels = llmsContainerLabels(llmsConfig, languages, page)
  const container = document.createElement('div')
  container.className = 'llms-container'
  container.setAttribute('data-vp-llms', '')
  container.setAttribute(
    'data-vp-llms-md-url',
    markdownRouteUrl(page, siteConfig)
  )
  container.setAttribute('data-vp-llms-label-link', labels.link)
  container.setAttribute('data-vp-llms-label-copy', labels.copy)
  container.setAttribute('data-vp-llms-label-chatgpt', labels.chatgpt)
  container.setAttribute('data-vp-llms-label-claude', labels.claude)
  container.setAttribute('data-vp-llms-label-options', labels.options)
  setBooleanData(container, 'data-vp-llms-copy', options.copy)
  setBooleanData(container, 'data-vp-llms-chatgpt', options.chatgpt)
  setBooleanData(container, 'data-vp-llms-claude', options.claude)

  if (options.link) {
    container.appendChild(createLinkButton(document, labels))
  }

  if (options.copy || options.chatgpt || options.claude) {
    container.appendChild(createOptionsButton(document, labels))
  }

  return container
}

export function injectLlmsControls(
  body = '',
  page: RoutePage = {},
  siteConfig: DocConfig = {},
  llmsConfig: LlmsConfig = {},
  languages: LanguagesConfig = {}
): string {
  const dom = new JSDOM(`<main>${body}</main>`)
  const document = dom.window.document
  const h1 = document.querySelector('main > h1')
  if (!h1) return body

  const container = createLlmsContainer(
    document,
    page,
    siteConfig,
    llmsConfig,
    languages
  )
  if (!container) return body

  h1.insertAdjacentElement('afterend', container)
  return document.querySelector('main')?.innerHTML || body
}
