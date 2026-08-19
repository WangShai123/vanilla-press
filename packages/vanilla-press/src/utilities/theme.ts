import { isPlainObject } from 'vanilla-jui'

type ThemeDefaultKey = 'mode' | 'theme' | 'radius' | 'shadow' | 'font'
type ThemeDefaultConfig = Record<ThemeDefaultKey, string>
type ThemeDefaultInput = Partial<Record<ThemeDefaultKey, unknown>>

export const DEFAULT_THEME_DEFAULT: ThemeDefaultConfig = {
  mode: 'dark',
  theme: 'indigo',
  radius: 'sm',
  shadow: 'sm',
  font: 'sm',
}

function normalizeThemeDefaultValue(
  defaults: ThemeDefaultInput,
  key: ThemeDefaultKey
): string {
  const value = typeof defaults?.[key] === 'string' ? defaults[key].trim() : ''
  return value || DEFAULT_THEME_DEFAULT[key]
}

export function normalizeThemeDefault(
  defaults: unknown = {}
): ThemeDefaultConfig {
  const values = isPlainObject(defaults) ? (defaults as ThemeDefaultInput) : {}

  return {
    mode: normalizeThemeDefaultValue(values, 'mode'),
    theme: normalizeThemeDefaultValue(values, 'theme'),
    radius: normalizeThemeDefaultValue(values, 'radius'),
    shadow: normalizeThemeDefaultValue(values, 'shadow'),
    font: normalizeThemeDefaultValue(values, 'font'),
  }
}

export function themeBootScript(defaults: unknown = {}): string {
  const themeDefault = normalizeThemeDefault(defaults)
  return `(function(d,k){var v=${JSON.stringify(themeDefault)},m=d.cookie.match(new RegExp('(?:^|; )'+k+'=([^;]*)')),o=v;if(m){try{var r=JSON.parse(decodeURIComponent(m[1]));if(r&&typeof r.val==='object')o=Object.assign({},v,r.val);}catch(e){o=v;}}try{var c=o.mode==='auto'?matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light':o.mode,h=d.documentElement;h.classList.add(c||'dark','j-theme-'+(o.theme||v.theme),'j-radius-'+(o.radius||v.radius),'j-shadow-'+(o.shadow||v.shadow),'j-font-'+(o.font||v.font));}catch(e){}})(document,'ui-theme');`
}
