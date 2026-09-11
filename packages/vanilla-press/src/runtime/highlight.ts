import { createRequire } from 'module'

import DEFAULT_HIGHLIGHT_LANGUAGES from '../config/highlight.ts'
import { toText } from '../utilities/string.ts'

const require = createRequire(import.meta.url)
const hljs = require('highlight.js') as HighlightJsCore

interface HighlightJsCore {
  getLanguage(name: string): HighlightLanguageData | undefined
  highlight(
    code: string,
    options: { language: string; ignoreIllegals: boolean }
  ): { value: string }
}

interface HighlightLanguageData {
  name?: string
}

interface HighlightLanguage {
  value: string
  label: string
}

const languageLabels = new Map<string, string>(
  (DEFAULT_HIGHLIGHT_LANGUAGES as HighlightLanguage[]).map(
    ({ value, label }) => [value, label]
  )
)

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeLanguage(value: unknown): string {
  const language = toText(value)
    .trim()
    .toLowerCase()
    .replace(/^language-/, '')

  if (!language) return 'plaintext'
  return language
}

function defaultLanguageLabel(language: string): string {
  return (
    languageLabels.get(language) || hljs.getLanguage(language)?.name || language
  )
}

function languageClass(language: unknown): string {
  return toText(language, 'plaintext').replace(/[^\w-]/g, '-')
}

function renderCode(language: string, label: string, value: string): string {
  return `<pre class="code-block hljs" data-vp-component><div class="code-header"><span class="code-dots"></span><span class="code-language">${escapeHtml(label)}</span></div><code class="language-${languageClass(language)}">${value}</code></pre>`
}

export function createHighlighter() {
  return (code: string, lang: string): string => {
    const language = normalizeLanguage(lang)
    const label = defaultLanguageLabel(language)
    const value = hljs.getLanguage(language)
      ? hljs.highlight(String(code), {
          language,
          ignoreIllegals: true,
        }).value
      : escapeHtml(code)

    return renderCode(language, label, value)
  }
}

export function highlight(code: string, lang: string): string {
  return createHighlighter()(code, lang)
}
