import { createRequire } from "module";
import { DEFAULT_HIGHLIGHT_LANGUAGES } from "../config/defaults.js";
import { runtimeOption } from "../utilities/features.js";

const require = createRequire(import.meta.url);
const hljs = require("highlight.js/lib/core");

const LANGUAGE_EXTRAS = {
  plaintext: { aliases: ["plain", "text", "txt"] },
  bash: { aliases: ["shell", "sh", "zsh"] },
  cpp: { aliases: ["c++", "cxx", "cc", "hpp"] },
  html: { module: "xml" },
  javascript: { aliases: ["js", "jsx"] },
  markdown: { aliases: ["md"] },
  typescript: { aliases: ["ts", "tsx"] },
  yaml: { aliases: ["yml"] },
};

const languageRegistry = new Map(
  DEFAULT_HIGHLIGHT_LANGUAGES.map(({ value, label }) => [
    value,
    {
      value,
      label,
      module: LANGUAGE_EXTRAS[value]?.module || value,
      aliases: LANGUAGE_EXTRAS[value]?.aliases || [],
    },
  ]),
);
const languageAliases = new Map();
const registeredModules = new Set();

for (const language of languageRegistry.values()) {
  languageAliases.set(language.value, language.value);
  for (const alias of language.aliases) {
    languageAliases.set(alias, language.value);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeLanguage(value) {
  const language = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^language-/, "");

  if (!language) return "plaintext";
  return languageAliases.get(language) || language;
}

function normalizeLanguageEntry(entry) {
  const value =
    typeof entry === "string" ? entry : entry && typeof entry === "object" ? entry.value : "";
  const language = normalizeLanguage(value);
  return languageRegistry.has(language) ? language : "";
}

function defaultLanguageLabel(language) {
  return languageRegistry.get(language)?.label || language;
}

function configuredLanguages(config = {}) {
  const highlight = runtimeOption(config, "highlight");
  const hasCustomLanguages =
    highlight && typeof highlight === "object" && Array.isArray(highlight.languages);
  const languages = hasCustomLanguages ? highlight.languages : DEFAULT_HIGHLIGHT_LANGUAGES;
  const supported = new Map();

  for (const entry of languages) {
    const language = normalizeLanguageEntry(entry);
    if (!language) continue;

    const label =
      entry && typeof entry === "object" && typeof entry.label === "string" && entry.label.trim()
        ? entry.label.trim()
        : defaultLanguageLabel(language);
    supported.set(language, label);
  }

  return supported;
}

function ensureLanguage(language) {
  const moduleName = languageRegistry.get(language)?.module;
  if (!moduleName) return "";
  if (registeredModules.has(moduleName)) return moduleName;

  try {
    const languageFactory = require(`highlight.js/lib/languages/${moduleName}`);
    hljs.registerLanguage(moduleName, languageFactory);
    registeredModules.add(moduleName);
    return moduleName;
  } catch {
    return "";
  }
}

function languageClass(language) {
  return String(language || "plaintext").replace(/[^\w-]/g, "-");
}

function renderCode(language, label, value) {
  return `<pre class="j-code-editor hljs"><div class="code-header"><span class="code-header-dots"></span><span class="code-header-language">${escapeHtml(label)}</span></div><code class="language-${languageClass(language)}">${value}</code></pre>`;
}

export function createHighlighter(config = {}) {
  const supportedLanguages = configuredLanguages(config);

  return (code, lang) => {
    const language = normalizeLanguage(lang);
    const label = supportedLanguages.get(language) || defaultLanguageLabel(language);
    const moduleName = supportedLanguages.has(language) ? ensureLanguage(language) : "";
    const value = moduleName
      ? hljs.highlight(String(code), { language: moduleName, ignoreIllegals: true }).value
      : escapeHtml(code);

    return renderCode(language, label, value);
  };
}

export function highlight(code, lang) {
  return createHighlighter()(code, lang);
}
