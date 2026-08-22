import type { RuntimeConfig } from '../types.ts'
import { browserOption } from './features.ts'

export const EDITOR_SIZE_VALUES = ['sm', 'md', 'lg', 'xl'] as const
export const DEFAULT_EDITOR_SIZE: EditorSize = 'sm'

export type EditorSize = (typeof EDITOR_SIZE_VALUES)[number]
export type EditorSizeConfig = boolean | EditorSize

export function isEditorSizeValue(value: unknown): value is EditorSize {
  return (
    typeof value === 'string' &&
    EDITOR_SIZE_VALUES.includes(value as EditorSize)
  )
}

export function normalizeEditorSize(
  value: unknown,
  fallback: EditorSize = DEFAULT_EDITOR_SIZE
): EditorSize {
  return isEditorSizeValue(value) ? value : fallback
}

export function editorSizeOption(config: RuntimeConfig = {}): unknown {
  return browserOption(config, 'editorSize')
}

export function isEditorSizeEnabled(config: RuntimeConfig = {}): boolean {
  return editorSizeOption(config) !== false
}

export function configuredEditorSize(config: RuntimeConfig = {}): EditorSize {
  const value = editorSizeOption(config)
  if (value === undefined || value === true || value === false) {
    return DEFAULT_EDITOR_SIZE
  }

  return normalizeEditorSize(value)
}

export function editorSizeClassName(size: unknown): string {
  return `is-${normalizeEditorSize(size)}`
}

export function editorClassName(config: RuntimeConfig = {}): string {
  return `j-editor ${editorSizeClassName(configuredEditorSize(config))}`
}

export function assertEditorSizeConfig(config: RuntimeConfig = {}): void {
  const value = editorSizeOption(config)
  if (
    value === undefined ||
    value === true ||
    value === false ||
    isEditorSizeValue(value)
  ) {
    return
  }

  throw new Error('editorSize must be false, true, or one of: sm, md, lg, xl.')
}

export function editorSizeBootScript(config: RuntimeConfig = {}): string {
  if (!isEditorSizeEnabled(config)) return ''

  const fallback = configuredEditorSize(config)

  return `(function(d,n,z,f){function v(s){return z.indexOf(s)>-1?s:f}function p(){var c=d.cookie?d.cookie.split('; '):[],m='';for(var i=0;i<c.length;i++){if(c[i].indexOf(n+'=')===0){m=c[i].slice(n.length+1);break}}if(!m)return f;try{var o=JSON.parse(decodeURIComponent(m));return v(o&&o.size)}catch(e){return f}}var s=p(),mo=null;function a(e){if(!e)return;z.forEach(function(x){e.classList.remove('is-'+x)});e.classList.add('is-'+s)}function r(){var e=d.querySelector('[data-vp-editor]');if(!e)return false;a(e);return true}if(!r()&&'MutationObserver'in window){var b=d.documentElement||d;mo=new MutationObserver(function(){if(r()&&mo)mo.disconnect()});mo.observe(b,{childList:true,subtree:true})}d.addEventListener('DOMContentLoaded',function(){r();if(mo)mo.disconnect()})})(document,'vanilla-press',${JSON.stringify(EDITOR_SIZE_VALUES)},${JSON.stringify(fallback)});`
}
