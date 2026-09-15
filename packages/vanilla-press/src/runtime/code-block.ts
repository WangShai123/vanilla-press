import { all, copy, icon, q } from 'vanilla-jui'

const RESET_DELAY = 2000
const resetTimers = new WeakMap<HTMLElement, number>()

function setIcon(button: HTMLElement, name: string): void {
  button.replaceChildren(icon(name))
}

function codeText(block: HTMLElement): string {
  const code = q<HTMLElement>('code', block)
  if (!code) return ''

  const lines = all<HTMLElement>('.line', code)
  if (!lines.length) return code.textContent || ''

  return lines.map((line) => line.textContent || '').join('\n')
}

function createCopyButton(block: HTMLElement): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'vp-code-copy j-button is-ghost is-icon'
  button.setAttribute('aria-label', 'Copy code')
  setIcon(button, 'copy')

  button.addEventListener('click', async () => {
    const success = await copy(codeText(block))
    if (!success) return

    const timer = resetTimers.get(button)
    if (timer) window.clearTimeout(timer)

    setIcon(button, 'check')
    resetTimers.set(
      button,
      window.setTimeout(() => {
        setIcon(button, 'copy')
        resetTimers.delete(button)
      }, RESET_DELAY)
    )
  })

  return button
}

function initBlock(block: HTMLElement): void {
  if (block.dataset.vpReady === 'true') return
  if (!q('.vp-code-copy', block)) {
    block.append(createCopyButton(block))
  }
  block.dataset.vpReady = 'true'
}

export function initCodeBlock(root: Document | Element): void {
  all<HTMLElement>(
    'pre.code-block[data-vp-component="code-block"]',
    root
  ).forEach(initBlock)
}
