export const AUTO_LOCALE = "auto";
export const PREFERENCE_COOKIE = "vanilla-press";

export function normalizeLocaleRoute(value = "") {
  return String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/g, "");
}

export function localeCode(value = "") {
  return String(value || "").trim().toLowerCase();
}

export function localeRouteEntries(languages = {}) {
  const entries = [];
  const seen = new Set();
  const locales = Array.isArray(languages.locales) ? languages.locales : [];

  for (const locale of locales) {
    const key = localeCode(locale?.code);
    const value = normalizeLocaleRoute(locale?.path);
    if (!key || !value || seen.has(key)) continue;

    seen.add(key);
    entries.push({ code: locale.code, route: value });
  }

  return entries;
}

export function defaultLocaleRoute(i18n = {}, languages = {}) {
  const entries = localeRouteEntries(languages);
  if (!entries.length) return AUTO_LOCALE;

  const preferred = localeCode(i18n.locale || languages.locale);
  return (
    entries.find((entry) => localeCode(entry.code) === preferred)?.route ||
    entries[0].route
  );
}

export function localeRouteForCode(code, i18n = {}, languages = {}) {
  const key = localeCode(code);
  return (
    localeRouteEntries(languages).find(
      (entry) => localeCode(entry.code) === key,
    )?.route || ""
  );
}

export function localeRouteValues(i18n = {}, languages = {}) {
  return localeRouteEntries(languages).map((entry) => entry.route);
}

export function isLocaleRoute(value, i18n = {}, languages = {}) {
  const route = normalizeLocaleRoute(value);
  return !!route && localeRouteValues(i18n, languages).includes(route);
}

export function i18nRedirectBootScript(i18n = {}, languages = {}) {
  const defaultRoute = defaultLocaleRoute(i18n, languages);
  const routes = localeRouteValues(i18n, languages);

  return `(function(w,d,n){var a=${JSON.stringify(AUTO_LOCALE)},r=${JSON.stringify(routes)},f=${JSON.stringify(defaultRoute)},m=d.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)')),p=null,o={};function c(){d.cookie=n+'='+encodeURIComponent(JSON.stringify(p))+'; expires='+new Date(Date.now()+31536e6).toUTCString()+'; path=/; SameSite=Lax'}if(m){try{p=JSON.parse(decodeURIComponent(m[1]))||{}}catch(e){p={}}}if(p===null){p=o;c()}var l=typeof p.locale==='string'?p.locale:'';if(!r.length){if(l!==a){p.locale=a;c()}return}if(!l){l=f;p.locale=l;c()}if(l===a)return;if(r.indexOf(l)<0){l=f;p.locale=l;c()}if(!l||l===a)return;var s=w.location.search+w.location.hash,t='./'+l+'/index.html';w.location.replace(t+s)})(window,document,${JSON.stringify(PREFERENCE_COOKIE)});`;
}
