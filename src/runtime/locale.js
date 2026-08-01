import { createEffect, jsx } from "vanilla-signal";
import { all } from "vanilla-jui";
import { currentLocale, joinLocalePath, pageWithoutLocale } from "./i18n.js";
import { localeCode, relativeAsset } from "./path.js";
import { ensurePreference, readPreference, updatePreference } from "./preference.js";
import { isI18nEnabled, runtimeOption } from "../utilities/features.js";
import {
  AUTO_LOCALE,
  defaultLocaleRoute,
  isLocaleRoute,
  localeRouteForCode,
  localeRouteValues,
} from "../utilities/i18n-routes.js";

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

  const i18n = runtimeOption(config, "i18n") || {};
  const preferred = i18n.locale || languages.locale;
  const preferredCode = localeCode(preferred);
  return locales.find((locale) => localeCode(locale.code) === preferredCode) || locales[0];
}

function redirectEnabled(config = {}) {
  return runtimeOption(config, "i18n")?.redirectToDefault !== false;
}

function localeForRoute(route, languages = {}, config = {}) {
  const i18n = runtimeOption(config, "i18n") || {};
  const value = String(route || "");
  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  return (
    locales.find((locale) => localeRouteForCode(locale?.code, i18n, languages) === value) ||
    defaultLocale(languages, config)
  );
}

function syncLocalePreference(config = {}, languages = {}, locale = null) {
  if (!isI18nEnabled(config) || !redirectEnabled(config)) return;

  const i18n = runtimeOption(config, "i18n") || {};
  const routes = localeRouteValues(i18n, languages);
  const current = readPreference();
  if (!routes.length) {
    updatePreference({ locale: AUTO_LOCALE });
    return;
  }
  if (current?.locale === AUTO_LOCALE) return;
  if (current?.locale && isLocaleRoute(current.locale, i18n, languages)) return;

  updatePreference({
    locale:
      localeRouteForCode(locale?.code, i18n, languages) ||
      defaultLocaleRoute(i18n, languages),
  });
}

export function maybeRedirectToDefaultLocale(config = {}, languages = {}, page = {}) {
  if (!isI18nEnabled(config)) return false;
  if (!redirectEnabled(config)) return false;

  const i18n = runtimeOption(config, "i18n") || {};
  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  const routes = localeRouteValues(i18n, languages);
  if (!routes.length) {
    updatePreference({ locale: AUTO_LOCALE });
    return false;
  }

  const rel = String(page.rel || "index.html")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
  if (hasLocalePrefix(rel, locales)) return false;

  const preference = ensurePreference();
  let route = typeof preference.locale === "string" ? preference.locale : "";
  if (!route) {
    route = defaultLocaleRoute(i18n, languages);
    updatePreference({ locale: route });
  }
  if (route === AUTO_LOCALE) return false;
  if (!isLocaleRoute(route, i18n, languages)) {
    route = defaultLocaleRoute(i18n, languages);
    updatePreference({ locale: route });
  }

  const locale = localeForRoute(route, languages, config);
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

  const i18nConfig = runtimeOption(config, "i18n") || {};
  const initialLocale = currentLocale(languages, page);
  syncLocalePreference(config, languages, initialLocale);

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

      if (redirectEnabled(config)) {
        updatePreference({
          locale:
            localeRouteForCode(nextLocale.code, i18nConfig, languages) ||
            defaultLocaleRoute(i18nConfig, languages),
        });
      }
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
