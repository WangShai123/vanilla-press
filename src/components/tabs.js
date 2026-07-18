import { createTabs } from 'vanilla-jui';
import {
  escapeAttr,
  markComponent,
  readContainer,
  splitByHeadings,
  splitMarkedBlocks,
} from '../utilities/markdown.js';

function parseTabs(content, info) {
  const titles = String(info || '')
    .match(/\[(.*)]/)?.[1]
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (titles?.length) {
    const headingBlocks = splitByHeadings(content, titles);
    if (headingBlocks.length) return headingBlocks;
  }

  return splitMarkedBlocks(content, /^@tab\s+(.+)$/i, 'Tab');
}

export function installTabs(md) {
  md.block.ruler.before(
    'fence',
    'doc_tabs',
    (state, startLine, endLine, silent) => {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      const end = state.eMarks[startLine];
      const line = state.src.slice(start, end);
      const match = line.match(/^:::tabs(?:\s+(.*))?$/);

      if (!match) return false;
      if (silent) return true;

      const token = state.push('doc_tabs', 'div', 0);
      const block = readContainer(state, startLine, endLine);
      token.block = true;
      token.content = block.content;
      token.info = match[1] || '';
      state.line = block.nextLine;
      return true;
    }
  );

  md.renderer.rules.doc_tabs = (tokens, idx, _options, env) => {
    markComponent(env, 'tabs');
    const blocks = parseTabs(tokens[idx].content, tokens[idx].info);
    const panels = blocks
      .map(
        (block) => `
          <div data-doc-tab data-title="${escapeAttr(block.title)}">
            ${md.render(block.content, env)}
          </div>`
      )
      .join('');

    return `<div class="doc-component doc-tabs" data-doc-component="tabs">${panels}</div>`;
  };
}

export function initTabs(root = document) {
  root.querySelectorAll('[data-doc-component="tabs"]').forEach((container) => {
    if (container.dataset.docReady === 'true') return;

    const panels = Array.from(container.querySelectorAll(':scope > [data-doc-tab]'));
    if (!panels.length) return;

    const tabs = panels.map((panel, index) => ({
      name: `tab-${index}`,
      title: panel.dataset.title || `Tab ${index + 1}`,
      panel: panel.innerHTML,
    }));

    container.textContent = '';
    createTabs(container, {
      tabs,
    }).build();

    container.dataset.docReady = 'true';
  });
}
