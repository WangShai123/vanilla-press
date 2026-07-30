import { createEffect, jsx } from "vanilla-signal";
import { all } from "vanilla-jui";
import { currentLocale, joinLocalePath, pageWithoutLocale } from "./i18n.js";
import { localeCode, relativeAsset } from "./path.js";
import { isI18nEnabled, runtimeOption } from "../utilities/features.js";

function hasLocalePrefix(rel, locales) {
  return locales.some((locale) => {
    const prefix = String(locale?.path || "")
      .replace(/^\/+/, "")
      .replace(/\/+$/g, "");
    return prefix && (rel === `${prefix}/index.html` || rel.startsWith(`${prefix}/`));
  });
}

function defaultLocale(languages = {}, config = {}) {
  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  if (!locales.length) return null;

  const preferred = runtimeOption(config, "i18n")?.defaultLocale || languages.locale;
  const preferredCode = localeCode(preferred);
  return locales.find((locale) => localeCode(locale.code) === preferredCode) || locales[0];
}

export function maybeRedirectToDefaultLocale(config = {}, languages = {}, page = {}) {
  if (!isI18nEnabled(config)) return false;
  if (runtimeOption(config, "i18n")?.redirectToDefault === false) return false;

  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  if (!locales.length) return false;

  const rel = String(page.rel || "index.html")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
  if (hasLocalePrefix(rel, locales)) return false;

  const locale = defaultLocale(languages, config);
  if (!locale) return false;

  const targetRel = joinLocalePath(locale, rel);
  if (!targetRel || targetRel === rel) return false;

  const targetHref = relativeAsset(rel, targetRel);
  const { search, hash } = window.location;
  window.location.replace(`${targetHref}${search}${hash}`);
  return true;
}

export function initLocale(languages = {}, page = {}, i18n, config = {}) {
  if (!isI18nEnabled(config)) {
    all("[data-doc-locale]").forEach((select) => {
      select.hidden = true;
      select.dataset.docReady = "true";
    });
    return;
  }

  const selects = all("[data-doc-locale]").filter(
    (select) => select.dataset.docReady !== "true",
  );
  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  if (!selects.length || !locales.length) return;

  const initialLocale = currentLocale(languages, page);

  selects.forEach((select) => {
    select.textContent = "";

    for (const locale of locales) {
      select.append(
        jsx("option", {
          value: localeCode(locale.code),
          children: locale.label || locale.code,
        }),
      );
    }

    select.addEventListener("change", () => {
      const nextLocale = locales.find((locale) => localeCode(locale.code) === select.value);
      if (!nextLocale) return;

      i18n.setLocale(nextLocale.code);
      const baseRel = pageWithoutLocale(page.rel, initialLocale);
      const nextRel = joinLocalePath(nextLocale, baseRel);
      window.location.href = relativeAsset(page.rel, nextRel);
    });

    select.dataset.docReady = "true";
  });

  createEffect(() => {
    selects.forEach((select) => {
      select.value = localeCode(i18n.getLocale());
    });
  });
}
