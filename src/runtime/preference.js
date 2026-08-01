import { PREFERENCE_COOKIE } from "../utilities/i18n-routes.js";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function cookiePattern(name) {
  return new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`);
}

export function readPreference() {
  const match = document.cookie.match(cookiePattern(PREFERENCE_COOKIE));
  if (!match) return null;

  try {
    const value = JSON.parse(decodeURIComponent(match[1]));
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function writePreference(preference = {}) {
  document.cookie = `${PREFERENCE_COOKIE}=${encodeURIComponent(JSON.stringify(preference))}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

export function ensurePreference() {
  const preference = readPreference();
  if (preference) return preference;

  writePreference({});
  return {};
}

export function updatePreference(next = {}) {
  const preference = { ...ensurePreference(), ...next };
  writePreference(preference);
  return preference;
}
