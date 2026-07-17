import { createEffect } from 'vanilla-signal';
import { currentLocale, joinLocalePath, pageWithoutLocale } from './i18n.js';
import { localeCode, relativeAsset } from './path.js';

export function initLocale(languages = {}, page = {}, i18n) {
  const selects = Array.from(document.querySelectorAll('[data-doc-locale]')).filter(
    (select) => select.dataset.docReady !== 'true'
  );
  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  if (!selects.length || !locales.length) return;

  const initialLocale = currentLocale(languages, page);

  selects.forEach((select) => {
    select.textContent = '';

    for (const locale of locales) {
      const option = document.createElement('option');
      option.value = localeCode(locale.code);
      option.textContent = locale.label || locale.code;
      select.append(option);
    }

    select.addEventListener('change', () => {
      const nextLocale = locales.find((locale) => localeCode(locale.code) === select.value);
      if (!nextLocale) return;

      i18n.setLocale(nextLocale.code);
      const baseRel = pageWithoutLocale(page.rel, initialLocale);
      const nextRel = joinLocalePath(nextLocale, baseRel);
      window.location.href = relativeAsset(page.rel, nextRel);
    });

    select.dataset.docReady = 'true';
  });

  createEffect(() => {
    selects.forEach((select) => {
      select.value = localeCode(i18n.getLocale());
    });
  });
}

