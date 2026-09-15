import { fromHighlighter } from '@shikijs/markdown-it'
import type { Element } from 'hast'
import type { MarkdownIt as MarkdownItType } from 'markdown-it'
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
import { toText } from '../utilities/string.ts'

type CodeHighlightThemes = Record<'light' | 'dark', BundledTheme>

const DEFAULT_SHIKI_THEMES: CodeHighlightThemes = {
  light: 'github-light-default',
  dark: 'github-dark-default',
}

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

const highlighterCache = new Map<string, Promise<CodeHighlighter>>()

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
    pre(hast) {
      this.addClassToHast(hast, ['code-block', 'vp-component'])
      hast.properties ||= {}
      hast.properties['data-vp-component'] = ''
      hast.children.unshift(codeHeader(languageLabel(this.options.lang)))
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

async function createCodeHighlighter(
  themes: CodeHighlightThemes
): Promise<CodeHighlighter> {
  async function load(value: CodeHighlightThemes): Promise<CodeHighlighter> {
    return {
      highlighter: await createHighlighter({
        themes: Object.values(value),
        langs: Object.keys(bundledLanguages) as BundledLanguage[],
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

async function getHighlighter(
  config: RuntimeConfig = {}
): Promise<CodeHighlighter> {
  const themes = highlightThemes(config)
  const cacheKey = highlighterCacheKey(themes)
  let highlighter = highlighterCache.get(cacheKey)

  if (!highlighter) {
    highlighter = createCodeHighlighter(themes)
    highlighterCache.set(cacheKey, highlighter)
  }

  return highlighter
}

export async function installCodeHighlight(
  md: MarkdownItType,
  config: RuntimeConfig = {}
): Promise<void> {
  const { highlighter, themes } = await getHighlighter(config)

  md.use(
    fromHighlighter(highlighter, {
      themes,
      defaultColor: 'light',
      defaultLanguage: 'markdown',
      fallbackLanguage: 'markdown',
      transformers: [createCodeBlockTransformer()],
    })
  )
}
