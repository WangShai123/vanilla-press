import { all, icon, q } from 'vanilla-jui'

import {
  escapeAttr,
  markComponent,
  type MarkdownRuntime,
  readContainer,
} from '../utilities/markdown.ts'
import { toText } from '../utilities/string.ts'

type TipType = 'info' | 'success' | 'warning' | 'danger'

interface TipInfo {
  type: TipType
  title: string
}

const TIP_TYPES: ReadonlySet<TipType> = new Set([
  'info',
  'success',
  'warning',
  'danger',
])

function isTipType(value: string): value is TipType {
  return TIP_TYPES.has(value as TipType)
}

function typeClass(type: TipType): string {
  return type === 'info' ? 'default' : type
}

function typeIcon(type: TipType): string {
  if (type === 'success') return 'success'
  if (type === 'warning') return 'warning'
  if (type === 'danger') return 'error'
  return 'info'
}

function parseTipInfo(name: unknown, info: unknown): TipInfo {
  const raw = toText(info).trim()
  if (name === 'tip') {
    return {
      type: 'info',
      title: raw,
    }
  }

  const normalized = toText(name).trim().toLowerCase()
  if (isTipType(normalized)) {
    return {
      type: normalized,
      title: raw,
    }
  }

  return {
    type: 'info',
    title: raw,
  }
}

function defaultTitle(): string {
  const lang = document.documentElement?.lang || ''
  return lang.toLowerCase().startsWith('zh') ? '提示' : 'Tip'
}

export function installTip(md: MarkdownRuntime): void {
  md.block.ruler.before(
    'fence',
    'doc_tip',
    (state, startLine, endLine, silent) => {
      const start = state.bMarks[startLine] + state.tShift[startLine]
      const end = state.eMarks[startLine]
      const line = state.src.slice(start, end)
      const match = line.match(
        /^:::\s*(tip|info|success|warning|danger)\b(?:\s+(.*))?$/i
      )

      if (!match) return false
      if (silent) return true

      const token = state.push('doc_tip', 'div', 0)
      const block = readContainer(state, startLine, endLine)
      token.block = true
      token.content = block.content
      token.info = match[2] || ''
      token.meta = { name: match[1].trim().toLowerCase() }
      state.line = block.nextLine
      return true
    }
  )

  md.renderer.rules.doc_tip = (tokens, idx, _options, env) => {
    markComponent(env, 'tip')
    const token = tokens[idx]
    const tip = parseTipInfo(token.meta?.name, token.info)

    return `<div class="j-tip is-${typeClass(tip.type)}" data-vp-component="tip" data-tip-icon="${typeIcon(tip.type)}">
  <div class="tip-icon" data-vp-tip-icon></div>
  <div class="tip-title" data-vp-tip-title>${escapeAttr(tip.title)}</div>
  <div class="tip-content">${md.render(token.content, env)}</div>
</div>`
  }
}

export function initTip(root: Document | Element = document): void {
  all<HTMLElement>('[data-vp-component="tip"]', root).forEach((container) => {
    if (container.dataset.vpReady === 'true') return

    const iconTarget = q<HTMLElement>('[data-vp-tip-icon]', container)
    const title = q<HTMLElement>('[data-vp-tip-title]', container)

    if (iconTarget) {
      iconTarget.textContent = ''
      iconTarget.append(icon(container.dataset.tipIcon || 'info'))
    }
    if (title && !title.textContent.trim()) {
      title.textContent = defaultTitle()
    }

    container.dataset.vpReady = 'true'
  })
}
