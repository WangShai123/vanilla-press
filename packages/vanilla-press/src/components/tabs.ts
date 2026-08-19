import { all, createTabs, type TabItem } from 'vanilla-jui'

import {
  escapeAttr,
  markComponent,
  type MarkdownRuntime,
  type MarkedBlock,
  readContainer,
  splitByHeadings,
  splitMarkedBlocks,
} from '../utilities/markdown.ts'
import { toText } from '../utilities/string.ts'

function parseTabs(content: string, info: unknown): MarkedBlock[] {
  const titles = toText(info)
    .match(/\[(.*)]/)?.[1]
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (titles?.length) {
    const headingBlocks = splitByHeadings(content, titles)
    if (headingBlocks.length) return headingBlocks
  }

  return splitMarkedBlocks(content, /^@tab\s+(.+)$/i, 'Tab')
}

function clonePanelContent(panel: HTMLElement): Node[] {
  return Array.from(panel.childNodes, (node) => node.cloneNode(true))
}

export function installTabs(md: MarkdownRuntime): void {
  md.block.ruler.before(
    'fence',
    'doc_tabs',
    (state, startLine, endLine, silent) => {
      const start = state.bMarks[startLine] + state.tShift[startLine]
      const end = state.eMarks[startLine]
      const line = state.src.slice(start, end)
      const match = line.match(/^:::tabs(?:\s+(.*))?$/)

      if (!match) return false
      if (silent) return true

      const token = state.push('doc_tabs', 'div', 0)
      const block = readContainer(state, startLine, endLine)
      token.block = true
      token.content = block.content
      token.info = match[1] || ''
      state.line = block.nextLine
      return true
    }
  )

  md.renderer.rules.doc_tabs = (tokens, idx, _options, env) => {
    markComponent(env, 'tabs')
    const blocks = parseTabs(tokens[idx].content, tokens[idx].info)
    const panels = blocks
      .map(
        (block) => `
          <div data-vp-tab data-title="${escapeAttr(block.title)}">
            ${md.render(block.content, env)}
          </div>`
      )
      .join('')

    return `<div class="vp-component vp-tabs" data-vp-component="tabs">${panels}</div>`
  }
}

export function initTabs(root: Document | Element = document): void {
  all<HTMLElement>('[data-vp-component="tabs"]', root).forEach((container) => {
    if (container.dataset.vpReady === 'true') return

    const panels = all<HTMLElement>(':scope > [data-vp-tab]', container)
    if (!panels.length) return

    const tabs: TabItem[] = panels.map((panel, index) => ({
      name: `tab-${index}`,
      title: panel.dataset.title || `Tab ${index + 1}`,
      content: clonePanelContent(panel),
    }))

    container.textContent = ''
    const instance = createTabs({
      data: tabs,
    })
    instance.mount(container)

    container.dataset.vpReady = 'true'
  })
}
