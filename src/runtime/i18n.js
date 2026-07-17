import { createI18n } from 'vanilla-signal-i18n';
import { localeCode, normalizeRel } from './path.js';

export function currentLocale(languages = {}, page = {}) {
  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  const rel = normalizeRel(page.rel || 'index.html');
  const sorted = [...locales].sort(
    (a, b) => normalizeRel(b.path).length - normalizeRel(a.path).length
  );

  return (
    sorted.find((locale) => {
      const prefix = normalizeRel(locale.path);
      return prefix && (rel === `${prefix}/index.html` || rel.startsWith(`${prefix}/`));
    }) ||
    locales.find((locale) => localeCode(locale.code) === localeCode(languages.locale)) ||
    locales[0] ||
    null
  );
}

export function pageWithoutLocale(pageRel, locale) {
  const rel = normalizeRel(pageRel || 'index.html');
  const prefix = normalizeRel(locale?.path);
  if (!prefix) return rel;
  if (rel === `${prefix}/index.html`) return 'index.html';
  return rel.startsWith(`${prefix}/`) ? rel.slice(prefix.length + 1) : rel;
}

export function joinLocalePath(locale, rel) {
  const prefix = normalizeRel(locale?.path);
  const target = normalizeRel(rel || 'index.html');
  return prefix ? `${prefix}/${target}` : target;
}

export function createDocI18n(languages = {}, page = {}) {
  const active = currentLocale(languages, page);
  return createI18n({
    locale: active?.code || languages.locale,
    fallbackLocale: languages.fallbackLocale || 'en',
    messages: languages.messages || languages.languages || {},
  });
}

export function localize(value, i18n) {
  if (value == null) return '';
  if (typeof value === 'object') {
    return value[i18n.getLocale()] || value[i18n.getFallbackLocale()] || Object.values(value)[0] || '';
  }
  return i18n.t(String(value));
}

