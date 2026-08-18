import { createRequire } from 'module';

import DEFAULT_HIGHLIGHT_LANGUAGES from '../config/highlight.ts';
import type { DocConfig } from '../types.ts';
import { isRecord } from '../types.ts';
import { runtimeOption } from '../utilities/features.ts';
import { toText } from '../utilities/string.ts';

const require = createRequire(import.meta.url);
const hljs = require('highlight.js/lib/core') as HighlightJsCore;

interface HighlightJsCore {
  registerLanguage(name: string, languageFactory: unknown): void;
  highlight(
    code: string,
    options: { language: string; ignoreIllegals: boolean }
  ): { value: string };
}

interface HighlightLanguage {
  value: string;
  label: string;
}

interface RegisteredLanguage extends HighlightLanguage {
  module: string;
  aliases: string[];
}

interface LanguageExtra {
  module?: string;
  aliases?: string[];
}

const LANGUAGE_EXTRAS: Record<string, LanguageExtra> = {
  plaintext: { aliases: ['plain', 'text', 'txt'] },
  bash: { aliases: ['shell', 'sh', 'zsh'] },
  cpp: { aliases: ['c++', 'cxx', 'cc', 'hpp'] },
  html: { module: 'xml' },
  javascript: { aliases: ['js', 'jsx'] },
  markdown: { aliases: ['md'] },
  typescript: { aliases: ['ts', 'tsx'] },
  yaml: { aliases: ['yml'] },
};

const languageRegistry = new Map<string, RegisteredLanguage>(
  DEFAULT_HIGHLIGHT_LANGUAGES.map(({ value, label }) => [
    value,
    {
      value,
      label,
      module: LANGUAGE_EXTRAS[value]?.module || value,
      aliases: LANGUAGE_EXTRAS[value]?.aliases || [],
    },
  ])
);
const languageAliases = new Map<string, string>();
const registeredModules = new Set<string>();

for (const language of languageRegistry.values()) {
  languageAliases.set(language.value, language.value);
  for (const alias of language.aliases) {
    languageAliases.set(alias, language.value);
  }
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeLanguage(value: unknown): string {
  const language = toText(value)
    .trim()
    .toLowerCase()
    .replace(/^language-/, '');

  if (!language) return 'plaintext';
  return languageAliases.get(language) || language;
}

function normalizeLanguageEntry(entry: unknown): string {
  const value =
    typeof entry === 'string'
      ? entry
      : isRecord(entry) && typeof entry.value === 'string'
        ? entry.value
        : '';
  const language = normalizeLanguage(value);
  return languageRegistry.has(language) ? language : '';
}

function defaultLanguageLabel(language: string): string {
  return languageRegistry.get(language)?.label || language;
}

function configuredLanguages(config: DocConfig = {}): Map<string, string> {
  const highlight = runtimeOption(config, 'highlight');
  const highlightConfig = isRecord(highlight) ? highlight : {};
  const languages: unknown[] = Array.isArray(highlightConfig.languages)
    ? highlightConfig.languages
    : DEFAULT_HIGHLIGHT_LANGUAGES;
  const supported = new Map<string, string>();

  for (const entry of languages) {
    const language = normalizeLanguageEntry(entry);
    if (!language) continue;

    const label =
      isRecord(entry) && typeof entry.label === 'string' && entry.label.trim()
        ? entry.label.trim()
        : defaultLanguageLabel(language);
    supported.set(language, label);
  }

  return supported;
}

function ensureLanguage(language: string): string {
  const moduleName = languageRegistry.get(language)?.module;
  if (!moduleName) return '';
  if (registeredModules.has(moduleName)) return moduleName;

  try {
    const languageFactory = require(`highlight.js/lib/languages/${moduleName}`);
    hljs.registerLanguage(moduleName, languageFactory);
    registeredModules.add(moduleName);
    return moduleName;
  } catch {
    return '';
  }
}

function languageClass(language: unknown): string {
  return toText(language, 'plaintext').replace(/[^\w-]/g, '-');
}

function renderCode(language: string, label: string, value: string): string {
  return `<pre class="j-code-editor hljs" data-vp-component><div class="code-header"><span class="code-dots"></span><span class="code-language">${escapeHtml(label)}</span></div><code class="language-${languageClass(language)}">${value}</code></pre>`;
}

export function createHighlighter(config: DocConfig = {}) {
  const supportedLanguages = configuredLanguages(config);

  return (code: string, lang: string): string => {
    const language = normalizeLanguage(lang);
    const label =
      supportedLanguages.get(language) || defaultLanguageLabel(language);
    const moduleName = supportedLanguages.has(language)
      ? ensureLanguage(language)
      : '';
    const value = moduleName
      ? hljs.highlight(String(code), {
          language: moduleName,
          ignoreIllegals: true,
        }).value
      : escapeHtml(code);

    return renderCode(language, label, value);
  };
}

export function highlight(code: string, lang: string): string {
  return createHighlighter()(code, lang);
}
