import { PREFERENCE_COOKIE } from '../utilities/i18n-routes.ts'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export interface DocPreference extends Record<string, unknown> {
  locale?: string
}

function cookiePattern(name: string): RegExp {
  return new RegExp(
    `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`
  )
}

export function readPreference(): DocPreference | null {
  const match = document.cookie.match(cookiePattern(PREFERENCE_COOKIE))
  if (!match) return null

  try {
    const value = JSON.parse(decodeURIComponent(match[1])) as unknown
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as DocPreference)
      : {}
  } catch {
    return {}
  }
}

export function writePreference(preference: DocPreference = {}): void {
  document.cookie = `${PREFERENCE_COOKIE}=${encodeURIComponent(JSON.stringify(preference))}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`
}

export function ensurePreference(): DocPreference {
  const preference = readPreference()
  if (preference) return preference

  writePreference({})
  return {}
}

export function updatePreference(next: DocPreference = {}): DocPreference {
  const preference = { ...ensurePreference(), ...next }
  writePreference(preference)
  return preference
}
