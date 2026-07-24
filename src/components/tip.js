import { icon } from 'vanilla-jui';
import { escapeAttr, markComponent, readContainer } from '../utilities/markdown.js';

const TIP_TYPES = new Set(['info', 'success', 'warning', 'danger']);

function typeClass(type) {
  return type === 'info' ? 'default' : type;
}

function typeIcon(type) {
  if (type === 'success') return 'success';
  if (type === 'warning') return 'warning';
  if (type === 'danger') return 'error';
  return 'info';
}

function parseTipInfo(name, info) {
  const raw = String(info || '').trim();
  if (name === 'tip') {
    return {
      type: 'info',
      title: raw,
    };
  }

  const normalized = String(name || '').trim().toLowerCase();
  if (TIP_TYPES.has(normalized)) {
    return {
      type: normalized,
      title: raw,
    };
  }

  return {
    type: 'info',
    title: raw,
  };
}

function defaultTitle() {
  const lang = document.documentElement?.lang || '';
  return lang.toLowerCase().startsWith('zh') ? '提示' : 'Tip';
}

export function installTip(md) {
  md.block.ruler.before('fence', 'doc_tip', (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const end = state.eMarks[startLine];
    const line = state.src.slice(start, end);
    const match = line.match(/^:::\s*(tip|info|success|warning|danger)\b(?:\s+(.*))?$/i);

    if (!match) return false;
    if (silent) return true;

    const token = state.push('doc_tip', 'div', 0);
    const block = readContainer(state, startLine, endLine);
    token.block = true;
    token.content = block.content;
    token.info = match[2] || '';
    token.meta = { name: match[1].trim().toLowerCase() };
    state.line = block.nextLine;
    return true;
  });

  md.renderer.rules.doc_tip = (tokens, idx, _options, env) => {
    markComponent(env, 'tip');
    const token = tokens[idx];
    const tip = parseTipInfo(token.meta?.name, token.info);

    return `<div class="j-tip is-${typeClass(tip.type)}" data-doc-component="tip" data-tip-icon="${typeIcon(tip.type)}">
  <div class="tip-icon" data-doc-tip-icon></div>
  <div class="tip-title" data-doc-tip-title>${escapeAttr(tip.title)}</div>
  <div class="tip-content">${md.render(token.content, env)}</div>
</div>`;
  };
}

export function initTip(root = document) {
  root.querySelectorAll('[data-doc-component="tip"]').forEach((container) => {
    if (container.dataset.docReady === 'true') return;

    const iconTarget = container.querySelector('[data-doc-tip-icon]');
    const title = container.querySelector('[data-doc-tip-title]');

    if (iconTarget) {
      iconTarget.textContent = '';
      iconTarget.append(icon(container.dataset.tipIcon || 'info'));
    }
    if (title && !title.textContent.trim()) {
      title.textContent = defaultTitle();
    }

    container.dataset.docReady = 'true';
  });
}
