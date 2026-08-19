import {
  escapeAttr,
  type MarkdownRuntime,
  parseBracketTitle,
  readContainer,
} from '../utilities/markdown.ts'

export function installDetails(md: MarkdownRuntime): void {
  md.block.ruler.before(
    'fence',
    'doc_details',
    (state, startLine, endLine, silent) => {
      const start = state.bMarks[startLine] + state.tShift[startLine]
      const end = state.eMarks[startLine]
      const line = state.src.slice(start, end)
      const match = line.match(/^:::\s*details(?:\s+(.*))?$/i)

      if (!match) return false
      if (silent) return true

      const token = state.push('doc_details', 'details', 0)
      const block = readContainer(state, startLine, endLine)
      token.block = true
      token.content = block.content
      token.info = match[1] || ''
      state.line = block.nextLine
      return true
    }
  )

  md.renderer.rules.doc_details = (tokens, idx, _options, env) => {
    const token = tokens[idx]
    const title = parseBracketTitle(token.info) || 'Details'

    return `<details data-vp-component><summary>${escapeAttr(title)}</summary>
${md.render(token.content, env)}
</details>`
  }
}
