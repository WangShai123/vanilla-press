import {
  escapeAttr,
  type MarkdownRuntime,
  readContainer,
} from '../utilities/markdown.ts';
import { toText } from '../utilities/string.ts';

interface BadgeOptions {
  theme: string;
  size: string;
}

function parseBadgeInfo(info: unknown): BadgeOptions {
  const parts = toText(info).trim().split(/\s+/).filter(Boolean);

  return {
    theme: parts[0] || 'default',
    size: parts[1] || 'md',
  };
}

export function installBadge(md: MarkdownRuntime): void {
  md.block.ruler.before(
    'fence',
    'doc_badge',
    (state, startLine, endLine, silent) => {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      const end = state.eMarks[startLine];
      const line = state.src.slice(start, end);
      const match = line.match(/^:::\s*badge(?:\s+(.*))?$/i);

      if (!match) return false;
      if (silent) return true;

      const token = state.push('doc_badge', 'div', 0);
      const block = readContainer(state, startLine, endLine);
      token.block = true;
      token.content = block.content.trim();
      token.info = match[1] || '';
      state.line = block.nextLine;
      return true;
    }
  );

  md.renderer.rules.doc_badge = (tokens, idx, _options, env) => {
    const token = tokens[idx];
    const badge = parseBadgeInfo(token.info);
    const className = `j-badge is-${badge.theme} is-${badge.size}`;

    return `<span class="${escapeAttr(className)}">${md.renderInline(token.content, env)}</span>`;
  };
}
