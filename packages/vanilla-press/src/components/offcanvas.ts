import { all, createOffcanvas, q, type OffcanvasDirection } from 'vanilla-jui';

import {
  escapeAttr,
  markComponent,
  type MarkdownRuntime,
  parseBracketTitle,
  readContainer,
} from '../utilities/markdown.ts';
import { toText } from '../utilities/string.ts';

const DIRECTIONS = new Set<OffcanvasDirection>([
  'left',
  'right',
  'top',
  'bottom',
]);

function parseDirection(info: unknown): OffcanvasDirection {
  for (const part of toText(info).split(/\s+/)) {
    if (DIRECTIONS.has(part as OffcanvasDirection)) {
      return part as OffcanvasDirection;
    }
  }
  return 'right';
}

export function installOffcanvas(md: MarkdownRuntime): void {
  md.block.ruler.before(
    'fence',
    'doc_offcanvas',
    (state, startLine, endLine, silent) => {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      const end = state.eMarks[startLine];
      const line = state.src.slice(start, end);
      const match = line.match(/^:::offcanvas(?:\s+(.*))?$/);

      if (!match) return false;
      if (silent) return true;

      const token = state.push('doc_offcanvas', 'div', 0);
      const block = readContainer(state, startLine, endLine);
      token.block = true;
      token.content = block.content;
      token.info = match[1] || '';
      state.line = block.nextLine;
      return true;
    }
  );

  md.renderer.rules.doc_offcanvas = (tokens, idx, _options, env) => {
    markComponent(env, 'offcanvas');
    const token = tokens[idx];
    const title = parseBracketTitle(token.info) || '打开面板';
    const direction = parseDirection(token.info);

    return `
      <div class="doc-component doc-offcanvas" data-vp-component="offcanvas" data-direction="${escapeAttr(direction)}">
        <button type="button" class="j-button is-outline" data-vp-offcanvas-trigger>${escapeAttr(title)}</button>
        <div hidden data-vp-offcanvas-content>
          <div class="doc-offcanvas-content j-content is-sm">
            ${md.render(token.content, env)}
          </div>
        </div>
      </div>`;
  };
}

export function initOffcanvas(root: Document | Element = document): void {
  all<HTMLElement>('[data-vp-component="offcanvas"]', root).forEach(
    (container) => {
      if (container.dataset.docReady === 'true') return;

      const trigger = q<HTMLElement>('[data-vp-offcanvas-trigger]', container);
      const content = q<HTMLElement>('[data-vp-offcanvas-content]', container);
      if (!trigger || !content) return;

      const contentBody = content.firstElementChild;
      if (!(contentBody instanceof HTMLElement)) return;

      const panel = createOffcanvas({
        direction: parseDirection(container.dataset.direction),
        content: contentBody,
      }).build();

      content.remove();
      trigger.addEventListener('click', () => panel.show());
      container.dataset.docReady = 'true';
    }
  );
}
