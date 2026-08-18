import { all, createAccordion } from 'vanilla-jui';

import {
  escapeAttr,
  markComponent,
  type MarkdownRuntime,
  parseFlag,
  readContainer,
  splitMarkedBlocks,
} from '../utilities/markdown.ts';

function parseAccordion(content: string) {
  return splitMarkedBlocks(content, /^@item\s+(.+)$/i, '面板');
}

function clonePanelContent(panel: HTMLElement): Node[] {
  return Array.from(panel.childNodes, (node) => node.cloneNode(true));
}

export function installAccordion(md: MarkdownRuntime): void {
  md.block.ruler.before(
    'fence',
    'doc_accordion',
    (state, startLine, endLine, silent) => {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      const end = state.eMarks[startLine];
      const line = state.src.slice(start, end);
      const match = line.match(/^:::(accordion|collapse)(?:\s+(.*))?$/);

      if (!match) return false;
      if (silent) return true;

      const token = state.push('doc_accordion', 'div', 0);
      const block = readContainer(state, startLine, endLine);
      token.block = true;
      token.content = block.content;
      token.info = match[2] || '';
      token.meta = { legacyCollapse: match[1] === 'collapse' };
      state.line = block.nextLine;
      return true;
    }
  );

  md.renderer.rules.doc_accordion = (tokens, idx, _options, env) => {
    markComponent(env, 'accordion');
    const token = tokens[idx];
    const info = token.info || '';
    const legacyTitle = info.match(/\[(.*)]/)?.[1]?.trim();
    const items =
      token.meta?.legacyCollapse === true
        ? [{ title: legacyTitle || '详情', content: token.content.trim() }]
        : parseAccordion(token.content);

    const attrs = [
      'data-vp-component="accordion"',
      parseFlag(info, 'multiple') ? 'data-multiple="true"' : '',
      parseFlag(info, 'collapsible') ? 'data-collapsible="true"' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const panels = items
      .map(
        (item) => `
          <div data-vp-accordion-item data-title="${escapeAttr(item.title)}">
            ${md.render(item.content, env)}
          </div>`
      )
      .join('');

    return `<div class="doc-component doc-accordion" ${attrs}>${panels}</div>`;
  };
}

export function initAccordion(root: Document | Element = document): void {
  all<HTMLElement>('[data-vp-component="accordion"]', root).forEach(
    (container) => {
      if (container.dataset.vpReady === 'true') return;

      const panels = all<HTMLElement>(
        ':scope > [data-vp-accordion-item]',
        container
      );
      if (!panels.length) return;

      const items = panels.map((panel, index) => ({
        name: `item-${index}`,
        title: panel.dataset.title || `面板 ${index + 1}`,
        content: clonePanelContent(panel),
      }));

      container.textContent = '';
      const accordion = createAccordion({
        collapsible: container.dataset.collapsible === 'true',
        multiple: container.dataset.multiple === 'true',
        data: items,
      });
      accordion.mount(container);

      container.dataset.vpReady = 'true';
    }
  );
}
