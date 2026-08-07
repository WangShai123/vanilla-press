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

const THEME_STORAGE_KEY = 'vanilla-storage::ui-theme';

function normalizeThemeDefaultValue(
  defaults: ThemeDefaultInput,
  key: ThemeDefaultKey
): string {
  const value = typeof defaults?.[key] === 'string' ? defaults[key].trim() : '';
  return value || DEFAULT_THEME_DEFAULT[key];
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
  return `(function(d,k){var v=${JSON.stringify(themeDefault)},e=encodeURIComponent(k),m=d.cookie.match(new RegExp('(?:^|; )'+e+'=([^;]*)')),o=v;function r(x){return x.mode==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):x.mode}function p(s){try{var a=JSON.parse(decodeURIComponent(s)),b=JSON.parse(a.value);return b&&b.value?b.value:null}catch(e){return null}}function w(x){var t=Date.now()+864e5,a=Object.assign({},x,{render:r(x)}),b={v:1,codec:'json',expiresAt:t,value:JSON.stringify({type:'json',value:a})};d.cookie=e+'='+encodeURIComponent(JSON.stringify(b))+'; expires='+new Date(t).toUTCString()+'; path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'')}if(m){o=Object.assign({},v,p(m[1])||{})}else{w(o)}try{var c=o.render||r(o),h=d.documentElement;h.classList.add(c||'dark','j-theme-'+(o.theme||v.theme),'j-radius-'+(o.radius||v.radius),'j-shadow-'+(o.shadow||v.shadow),'j-font-'+(o.font||v.font))}catch(e){}})(document,${JSON.stringify(THEME_STORAGE_KEY)});`;
}
