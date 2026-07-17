import { createOffcanvas } from 'vanilla-jui';
import { escapeAttr, markComponent, parseBracketTitle, readContainer } from './utils.js';

const DIRECTIONS = new Set(['left', 'right', 'top', 'bottom']);

function parseDirection(info) {
  for (const part of String(info || '').split(/\s+/)) {
    if (DIRECTIONS.has(part)) return part;
  }
  return 'right';
}

export function installOffcanvas(md) {
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
      <div class="doc-component doc-offcanvas" data-doc-component="offcanvas" data-direction="${escapeAttr(direction)}">
        <button type="button" class="j-button is-outline" data-doc-offcanvas-trigger>${escapeAttr(title)}</button>
        <div hidden data-doc-offcanvas-content>
          ${md.render(token.content, env)}
        </div>
      </div>`;
  };
}

export function initOffcanvas(root = document) {
  root
    .querySelectorAll('[data-doc-component="offcanvas"]')
    .forEach((container) => {
      if (container.dataset.docReady === 'true') return;

      const trigger = container.querySelector('[data-doc-offcanvas-trigger]');
      const content = container.querySelector('[data-doc-offcanvas-content]');
      if (!trigger || !content) return;

      const panel = createOffcanvas({
        direction: container.dataset.direction || 'right',
        content: content.innerHTML,
      });

      trigger.addEventListener('click', () => panel.show());
      container.dataset.docReady = 'true';
    });
}
