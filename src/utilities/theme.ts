import { isPlainObject } from 'vanilla-jui';

type ThemeDefaultKey = 'mode' | 'theme' | 'radius' | 'shadow' | 'font';
type ThemeDefaultConfig = Record<ThemeDefaultKey, string>;
type ThemeDefaultInput = Partial<Record<ThemeDefaultKey, unknown>>;

export const DEFAULT_THEME_DEFAULT: ThemeDefaultConfig = {
  mode: 'dark',
  theme: 'indigo',
  radius: 'sm',
  shadow: 'sm',
  font: 'sm',
};

const THEME_DEFAULT_OPTIONS: Record<ThemeDefaultKey, Set<string>> = {
  mode: new Set(['dark', 'light']),
  theme: new Set([
    'gray',
    'olive',
    'tomato',
    'ruby',
    'pink',
    'violet',
    'indigo',
    'blue',
    'teal',
    'grass',
    'mint',
    'lime',
    'yellow',
    'orange',
    'gold',
  ]),
  radius: new Set(['sm', 'md', 'lg', 'xl', 'round']),
  shadow: new Set(['none', 'sm', 'md', 'lg']),
  font: new Set(['sm', 'md']),
};

function normalizeThemeDefaultValue(
  defaults: ThemeDefaultInput,
  key: ThemeDefaultKey
): string {
  const value = typeof defaults?.[key] === 'string' ? defaults[key].trim() : '';
  return THEME_DEFAULT_OPTIONS[key].has(value)
    ? value
    : DEFAULT_THEME_DEFAULT[key];
}

export function normalizeThemeDefault(
  defaults: unknown = {}
): ThemeDefaultConfig {
  const values = isPlainObject(defaults) ? (defaults as ThemeDefaultInput) : {};

  return {
    mode: normalizeThemeDefaultValue(values, 'mode'),
    theme: normalizeThemeDefaultValue(values, 'theme'),
    radius: normalizeThemeDefaultValue(values, 'radius'),
    shadow: normalizeThemeDefaultValue(values, 'shadow'),
    font: normalizeThemeDefaultValue(values, 'font'),
  };
}

export function themeBootScript(defaults: unknown = {}): string {
  const themeDefault = normalizeThemeDefault(defaults);
  return `(function(d,k){var v=${JSON.stringify(themeDefault)},m=d.cookie.match(new RegExp('(?:^|; )'+k+'=([^;]*)')),o=v;if(m){try{o=Object.assign({},v,JSON.parse(decodeURIComponent(m[1])))}catch(e){o=v}}else{d.cookie=k+'='+JSON.stringify(v)+'; expires='+new Date(Date.now()+864e5).toUTCString()+'; path=/; sameSite=Lax'}try{var r=o.mode==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):o.mode,h=d.documentElement;h.classList.add(r||'dark','j-theme-'+(o.theme||v.theme),'j-radius-'+(o.radius||v.radius),'j-shadow-'+(o.shadow||v.shadow),'j-font-'+(o.font||v.font))}catch(e){}})(document,'ui-theme');`;
}
