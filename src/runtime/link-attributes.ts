import { all, icon, q } from 'vanilla-jui';
import { jsx } from 'vanilla-signal';

import './icons.ts';

const EXTERNAL_LINK_SELECTOR = 'a[href^="http://"], a[href^="https://"]';
const LINK_SCOPE_SELECTOR =
  '[data-doc-editor], .j-content, [data-doc-menu], [data-doc-sidebar]';
const EXTERNAL_LINK_READY_ATTR = 'data-doc-external-link';
const EXTERNAL_LINK_ICON_ATTR = 'data-doc-external-link-icon';

let observerStarted = false;

function isElement(value: unknown): value is Element {
  return value instanceof Element;
}

function isExternalLink(value: Element): value is HTMLAnchorElement {
  return (
    value instanceof HTMLAnchorElement && value.matches(EXTERNAL_LINK_SELECTOR)
  );
}

function appendExternalIcon(link: HTMLAnchorElement): void {
  if (q(`[${EXTERNAL_LINK_ICON_ATTR}]`, link)) return;

  const iconNode = jsx('span', {
    className: 'external-link',
    children: icon('arrow-right-up-line', {
      className: 'el-icon',
      [EXTERNAL_LINK_ICON_ATTR]: 'true',
    }),
  });
  link.append(iconNode);
}

function applyLinkAttributes(link: Element): void {
  if (!isExternalLink(link)) return;

  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  appendExternalIcon(link);
  link.setAttribute(EXTERNAL_LINK_READY_ATTR, 'true');
}

function applyLinkAttributesIn(root: Document | Element = document): void {
  if (isElement(root) && isExternalLink(root)) {
    applyLinkAttributes(root);
  }

  all<Element>(EXTERNAL_LINK_SELECTOR, root).forEach((link) => {
    applyLinkAttributes(link);
  });
}

function applyScopedLinkAttributes(root: Document | Element = document): void {
  if (root === document) {
    all<Element>(LINK_SCOPE_SELECTOR).forEach((scope) => {
      applyLinkAttributesIn(scope);
    });
    return;
  }

  if (!isElement(root)) return;

  if (root.closest(LINK_SCOPE_SELECTOR)) {
    applyLinkAttributesIn(root);
    return;
  }

  all<Element>(LINK_SCOPE_SELECTOR, root).forEach((scope) => {
    applyLinkAttributesIn(scope);
  });
}

function watchExternalLinks(): void {
  if (observerStarted) return;
  if (typeof MutationObserver === 'undefined') return;
  if (!document.body) return;

  observerStarted = true;
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (isElement(node)) applyScopedLinkAttributes(node);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

export function initLinkAttributes(root: Document | Element = document): void {
  applyScopedLinkAttributes(root);
  if (root === document) watchExternalLinks();
}
