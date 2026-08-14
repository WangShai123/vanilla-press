import { createI18n } from 'vanilla-signal-i18n';

import type {
  DocI18n,
  LanguagesConfig,
  LocaleEntry,
  RuntimePage,
} from '../types.ts';
import { isRecord } from '../types.ts';
import { toText } from '../utilities/string.ts';
import { localeCode, normalizeRel } from './path.ts';

export function currentLocale(
  languages: LanguagesConfig = {},
  page: RuntimePage = {}
): LocaleEntry | null {
  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  const rel = normalizeRel(page.rel || 'index.html');
  const sorted = [...locales].sort(
    (a, b) => normalizeRel(b.path).length - normalizeRel(a.path).length
  );

  return (
    sorted.find((locale) => {
      const prefix = normalizeRel(locale.path);
      return (
        prefix &&
        (rel === `${prefix}/index.html` || rel.startsWith(`${prefix}/`))
      );
    }) ||
    locales.find(
      (locale) => localeCode(locale.code) === localeCode(languages.locale)
    ) ||
    locales[0] ||
    null
  );
}

export function pageWithoutLocale(
  pageRel: unknown,
  locale?: LocaleEntry | null
): string {
  const rel = normalizeRel(pageRel || 'index.html');
  const prefix = normalizeRel(locale?.path);
  if (!prefix) return rel;
  if (rel === `${prefix}/index.html`) return 'index.html';
  return rel.startsWith(`${prefix}/`) ? rel.slice(prefix.length + 1) : rel;
}

export function joinLocalePath(
  locale: LocaleEntry | null | undefined,
  rel: unknown
): string {
  const prefix = normalizeRel(locale?.path);
  const target = normalizeRel(rel || 'index.html');
  return prefix ? `${prefix}/${target}` : target;
}

export function createDocI18n(
  languages: LanguagesConfig = {},
  page: RuntimePage = {}
): DocI18n {
  const active = currentLocale(languages, page);
  const messages = (
    isRecord(languages.messages)
      ? languages.messages
      : languages.languages || {}
  ) as Record<string, Record<string, unknown>>;

  return createI18n({
    locale: active?.code || languages.locale,
    fallbackLocale: languages.fallbackLocale || 'en',
    messages,
  });
}

export function localize(value: unknown, i18n: DocI18n): string {
  if (value == null) return '';
  if (isRecord(value)) {
    const translated =
      value[i18n.getLocale()] || value[i18n.getFallbackLocale()];
    return toText(translated || Object.values(value)[0]);
  }
  return i18n.t(toText(value));
}
