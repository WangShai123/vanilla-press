import type { RuntimeConfig } from '../types.ts'
import {
  EDITOR_SIZE_VALUES,
  configuredEditorSize,
  isEditorSizeEnabled,
  normalizeEditorSize,
  type EditorSize,
} from '../utilities/editor-size.ts'
import { readPreference, updatePreference } from './preference.ts'

type SizeAction = 'decrease' | 'increase'

const BUTTON_SELECTOR = '[data-vp-editor-size-action]'
const READY_KEY = 'vpEditorSizeReady'

function sizeIndex(size: EditorSize): number {
  return EDITOR_SIZE_VALUES.indexOf(size)
}

function nextSize(size: EditorSize, action: SizeAction): EditorSize {
  const nextIndex = sizeIndex(size) + (action === 'increase' ? 1 : -1)
  const bounded = Math.min(
    Math.max(nextIndex, 0),
    EDITOR_SIZE_VALUES.length - 1
  )
  return EDITOR_SIZE_VALUES[bounded]
}

function applyEditorSize(size: EditorSize): void {
  document
    .querySelectorAll<HTMLElement>('[data-vp-editor]')
    .forEach((editor) => {
      for (const item of EDITOR_SIZE_VALUES) {
        editor.classList.remove(`is-${item}`)
      }
      editor.classList.add(`is-${size}`)
    })
}

function updateButtons(size: EditorSize): void {
  document
    .querySelectorAll<HTMLButtonElement>(BUTTON_SELECTOR)
    .forEach((button) => {
      const action = button.dataset.vpEditorSizeAction as SizeAction | undefined
      button.disabled =
        (action === 'decrease' && size === EDITOR_SIZE_VALUES[0]) ||
        (action === 'increase' &&
          size === EDITOR_SIZE_VALUES[EDITOR_SIZE_VALUES.length - 1])
    })
}

function initialSize(config: RuntimeConfig = {}): EditorSize {
  const preference = readPreference()
  return normalizeEditorSize(preference?.size, configuredEditorSize(config))
}

export function initEditorSize(config: RuntimeConfig = {}): void {
  if (!isEditorSizeEnabled(config)) return

  let size = initialSize(config)
  applyEditorSize(size)
  updatePreference({ size })

  document
    .querySelectorAll<HTMLButtonElement>(BUTTON_SELECTOR)
    .forEach((button) => {
      if (button.dataset[READY_KEY] === 'true') return

      button.addEventListener('click', () => {
        const action = button.dataset.vpEditorSizeAction as
          | SizeAction
          | undefined
        if (action !== 'decrease' && action !== 'increase') return

        size = nextSize(size, action)
        applyEditorSize(size)
        updatePreference({ size })
        updateButtons(size)
      })

      button.dataset[READY_KEY] = 'true'
    })

  updateButtons(size)
}
