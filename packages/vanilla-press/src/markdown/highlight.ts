import { fromHighlighter } from '@shikijs/markdown-it'
import type { Element } from 'hast'
import type { MarkdownIt as MarkdownItType, StateCore } from 'markdown-it'
import {
  bundledLanguages,
  bundledLanguagesInfo,
  bundledThemes,
  createHighlighter,
  type BundledLanguage,
  type BundledTheme,
  type Highlighter,
  type ShikiTransformer,
} from 'shiki'

import type { RuntimeConfig } from '../types.ts'
import { isRecord } from '../types.ts'
import { serverOption } from '../utilities/features.ts'
import { markComponent } from '../utilities/markdown.ts'
import { toText } from '../utilities/string.ts'

type CodeHighlightThemes = Record<'light' | 'dark', BundledTheme>

const DEFAULT_SHIKI_THEMES: CodeHighlightThemes = {
  light: 'github-light-default',
  dark: 'github-dark-default',
}
const DEFAULT_SHIKI_LANGUAGES = ['markdown', 'md'] satisfies BundledLanguage[]

const languageLabels = new Map<string, string>()

for (const language of bundledLanguagesInfo) {
  languageLabels.set(language.id, language.name)
  for (const alias of language.aliases || []) {
    languageLabels.set(alias, language.name)
  }
}

interface CodeHighlighter {
  highlighter: Highlighter
  themes: CodeHighlightThemes
}

interface CodeNotationState {
  classes: Map<number, Set<string>>
  focus: boolean
  lineNumbers: boolean
  lineNumberStart: number
}

const highlighterCache = new Map<string, Promise<CodeHighlighter>>()
const CODE_NOTATION_META = 'vanillaPressCodeNotation'
const CODE_DIRECTIVE_RE =
  /\s*(?:(?:\/\/|#|--|;|<!--|\/\*)\s*)?\[!code\s+([^\]]+)\]\s*(?:-->|\*\/)?/g
const CODE_LINE_RANGE_ATTR_RE = /^[\d,\-\s]+$/

function appendClass(
  state: CodeNotationState,
  line: number,
  className: string
): void {
  if (line < 1) return

  const classes = state.classes.get(line) || new Set<string>()
  for (const item of className.split(/\s+/).filter(Boolean)) {
    classes.add(item)
  }
  state.classes.set(line, classes)
}

function appendRange(
  state: CodeNotationState,
  line: number,
  length: number,
  className: string
): void {
  const count = Math.max(1, length)
  for (let index = 0; index < count; index += 1) {
    appendClass(state, line + index, className)
  }
}

function directiveLength(value: string): number {
  const match = value.match(/:(\d+)\s*$/)
  return match ? Number(match[1]) || 1 : 1
}

function applyDirective(
  state: CodeNotationState,
  line: number,
  value: string
): void {
  const directive = value.trim().toLowerCase()
  const length = directiveLength(directive)

  if (directive.startsWith('highlight')) {
    appendRange(state, line, length, 'highlighted')
  } else if (directive.startsWith('focus')) {
    state.focus = true
    appendRange(state, line, length, 'focused')
  } else if (directive === '++' || directive.startsWith('diff-add')) {
    appendRange(state, line, length, 'diff add')
  } else if (directive === '--' || directive.startsWith('diff-remove')) {
    appendRange(state, line, length, 'diff remove')
  } else if (directive.startsWith('warning')) {
    appendRange(state, line, length, 'warning')
  } else if (directive.startsWith('error')) {
    appendRange(state, line, length, 'error')
  }
}

function shouldParseDirectives(language: unknown): boolean {
  const lang = normalizeLanguage(language)
  return lang !== 'md' && lang !== 'markdown'
}

function parseLineRanges(value: string): number[] {
  const lines = new Set<number>()

  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const [from, to] = item.split('-').map((part) => Number(part.trim()))
      if (!Number.isFinite(from) || from < 1) return

      const end = Number.isFinite(to) && to >= from ? to : from
      for (let line = from; line <= end; line += 1) lines.add(line)
    })

  return Array.from(lines)
}

function isLineRangeAttr(attr: [string, string | number]): boolean {
  const [name, value] = attr
  return (
    value === '' &&
    CODE_LINE_RANGE_ATTR_RE.test(name) &&
    parseLineRanges(name).length > 0
  )
}

function restoreFenceLineRangeMeta(state: StateCore): void {
  for (const token of state.tokens) {
    if (token.type !== 'fence') continue

    markComponent(state.env, 'code-block')
    if (!token.attrs?.length) continue

    const ranges: string[] = []
    const attrs = token.attrs.filter((attr) => {
      if (!isLineRangeAttr(attr)) return true
      ranges.push(attr[0])
      return false
    })

    if (!ranges.length) continue

    token.attrs = attrs.length ? attrs : null
    const restored = ranges.map((range) => `{${range}}`).join(' ')
    token.info = token.info ? `${token.info} ${restored}` : restored
  }
}

function parseMeta(
  raw = ''
): Pick<CodeNotationState, 'classes' | 'lineNumbers' | 'lineNumberStart'> {
  const classes = new Map<number, Set<string>>()
  const rangeMatch = raw.match(/\{([\d,\-\s]+)\}/)
  const lineNumberMatch = raw.match(
    /\b(?:line-numbers|showLineNumbers)(?:=(\d+))?\b/
  )

  if (rangeMatch) {
    for (const line of parseLineRanges(rangeMatch[1] || '')) {
      classes.set(line, new Set(['highlighted']))
    }
  }

  return {
    classes,
    lineNumbers: Boolean(lineNumberMatch),
    lineNumberStart: lineNumberMatch?.[1] ? Number(lineNumberMatch[1]) || 1 : 1,
  }
}

function codeNotationState(meta: unknown): CodeNotationState | undefined {
  if (!isRecord(meta)) return undefined
  return meta[CODE_NOTATION_META] as CodeNotationState | undefined
}

function setCodeNotationState(meta: unknown, state: CodeNotationState): void {
  if (!isRecord(meta)) return
  meta[CODE_NOTATION_META] = state
}

function appendStyle(hast: Element, style: string): void {
  const current = toText(hast.properties?.style).trim()
  hast.properties ||= {}
  hast.properties.style = current ? `${current};${style}` : style
}

function text(value: string): Element {
  return {
    type: 'element',
    tagName: 'span',
    properties: {},
    children: [{ type: 'text', value }],
  }
}

function codeHeader(label: string): Element {
  return {
    type: 'element',
    tagName: 'div',
    properties: { class: 'code-header' },
    children: [
      {
        type: 'element',
        tagName: 'span',
        properties: { class: 'code-dots' },
        children: [],
      },
      {
        ...text(label),
        properties: { class: 'code-language' },
      },
    ],
  }
}

function normalizeLanguage(value: unknown): string {
  return toText(value)
    .trim()
    .toLowerCase()
    .replace(/^language-/, '')
}

function languageLabel(value: unknown): string {
  const language = normalizeLanguage(value)
  return languageLabels.get(language) || language || 'Text'
}

function createCodeBlockTransformer(): ShikiTransformer {
  return {
    name: 'vanilla-press:code-block',
    preprocess(code, options) {
      const meta = parseMeta(toText(options.meta?.__raw))
      const state: CodeNotationState = {
        classes: meta.classes,
        focus: false,
        lineNumbers: meta.lineNumbers,
        lineNumberStart: meta.lineNumberStart,
      }

      if (!shouldParseDirectives(options.lang)) {
        setCodeNotationState(this.meta, state)
        return code
      }

      const lines: string[] = []

      for (const line of code.split('\n')) {
        const directives: string[] = []
        const cleanLine = line.replace(
          CODE_DIRECTIVE_RE,
          (_match, directive) => {
            directives.push(toText(directive))
            return ''
          }
        )

        if (directives.length && cleanLine.trim() === '') {
          const targetLine = lines.length + 1
          for (const directive of directives) {
            applyDirective(state, targetLine, directive)
          }
          continue
        }

        const currentLine = lines.length + 1
        for (const directive of directives) {
          applyDirective(state, currentLine, directive)
        }
        lines.push(cleanLine)
      }

      setCodeNotationState(this.meta, state)
      return lines.join('\n')
    },
    pre(hast) {
      const state = codeNotationState(this.meta)
      this.addClassToHast(hast, ['code-block', 'vp-component'])
      if (state?.focus) this.addClassToHast(hast, 'has-focused-lines')
      if (state?.lineNumbers) {
        this.addClassToHast(hast, 'has-line-numbers')
        appendStyle(
          hast,
          `--vp-code-line-start:${Math.max(0, state.lineNumberStart - 1)}`
        )
      }
      hast.properties ||= {}
      hast.properties['data-vp-component'] = 'code-block'
      hast.children.unshift(codeHeader(languageLabel(this.options.lang)))
      return hast
    },
    code(hast) {
      hast.children = hast.children.filter(
        (child) => child.type !== 'text' || child.value !== '\n'
      )
      return hast
    },
    line(hast, line) {
      const state = codeNotationState(this.meta)
      const classes = state?.classes.get(line)
      if (classes?.size) {
        this.addClassToHast(hast, Array.from(classes))
      }
      return hast
    },
  }
}

function themeExists(theme: string): theme is BundledTheme {
  return Object.hasOwn(bundledThemes, theme)
}

function normalizeTheme(value: unknown, fallback: BundledTheme): BundledTheme {
  const theme = toText(value).trim()
  return theme && themeExists(theme) ? theme : fallback
}

function highlightThemes(config: RuntimeConfig = {}): CodeHighlightThemes {
  const highlight = serverOption(config, 'highlight')

  if (!isRecord(highlight)) return DEFAULT_SHIKI_THEMES

  return {
    light: normalizeTheme(highlight.light, DEFAULT_SHIKI_THEMES.light),
    dark: normalizeTheme(highlight.dark, DEFAULT_SHIKI_THEMES.dark),
  }
}

function highlighterCacheKey(themes: CodeHighlightThemes): string {
  return `${themes.light}\n${themes.dark}`
}

function languageExists(language: string): language is BundledLanguage {
  return Object.hasOwn(bundledLanguages, language)
}

function highlighterLanguages(languages: string[] = []): BundledLanguage[] {
  const result = new Set<BundledLanguage>(DEFAULT_SHIKI_LANGUAGES)

  for (const value of languages) {
    const language = normalizeLanguage(value)
    if (language && languageExists(language)) result.add(language)
  }

  return Array.from(result).sort()
}

async function createCodeHighlighter(
  themes: CodeHighlightThemes
): Promise<CodeHighlighter> {
  async function load(value: CodeHighlightThemes): Promise<CodeHighlighter> {
    return {
      highlighter: await createHighlighter({
        themes: Object.values(value),
        langs: DEFAULT_SHIKI_LANGUAGES,
      }),
      themes: value,
    }
  }

  try {
    return await load(themes)
  } catch (error) {
    if (
      themes.light === DEFAULT_SHIKI_THEMES.light &&
      themes.dark === DEFAULT_SHIKI_THEMES.dark
    ) {
      throw error
    }

    const lightFallback = {
      light: DEFAULT_SHIKI_THEMES.light,
      dark: themes.dark,
    }
    const darkFallback = {
      light: themes.light,
      dark: DEFAULT_SHIKI_THEMES.dark,
    }

    try {
      return await load(lightFallback)
    } catch {
      try {
        return await load(darkFallback)
      } catch {
        return load(DEFAULT_SHIKI_THEMES)
      }
    }
  }
}

async function loadMissingLanguages(
  highlighter: Highlighter,
  languages: BundledLanguage[]
): Promise<void> {
  const loaded = new Set(highlighter.getLoadedLanguages())
  const missing = languages.filter((language) => !loaded.has(language))

  if (missing.length) await highlighter.loadLanguage(...missing)
}

async function getHighlighter(
  config: RuntimeConfig = {},
  languages: string[] = []
): Promise<CodeHighlighter> {
  const themes = highlightThemes(config)
  const shikiLanguages = highlighterLanguages(languages)
  const cacheKey = highlighterCacheKey(themes)
  let highlighter = highlighterCache.get(cacheKey)

  if (!highlighter) {
    highlighter = createCodeHighlighter(themes)
    highlighterCache.set(cacheKey, highlighter)
  }

  const result = await highlighter
  await loadMissingLanguages(result.highlighter, shikiLanguages)
  return result
}

export async function installCodeHighlight(
  md: MarkdownItType,
  config: RuntimeConfig = {},
  languages: string[] = []
): Promise<void> {
  const { highlighter, themes } = await getHighlighter(config, languages)

  md.use(
    fromHighlighter(highlighter, {
      themes,
      defaultColor: 'light',
      defaultLanguage: 'markdown',
      fallbackLanguage: 'markdown',
      transformers: [createCodeBlockTransformer()],
    })
  )
  md.core.ruler.push(
    'vanilla_press_code_line_ranges',
    restoreFenceLineRangeMeta
  )
}

export async function clearCodeHighlighterCache(): Promise<void> {
  const highlighters = Array.from(highlighterCache.values())
  highlighterCache.clear()

  await Promise.all(
    highlighters.map(async (item) => {
      const { highlighter } = await item
      highlighter.dispose()
    })
  )
}
