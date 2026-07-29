import { icon } from "vanilla-jui";
import { jsx } from "vanilla-signal";
import "./icons.js";

const EXTERNAL_LINK_SELECTOR = 'a[href^="http://"], a[href^="https://"]';
const CONTENT_SELECTOR = ".j-content";
const EXTERNAL_LINK_READY_ATTR = "data-doc-external-link";
const EXTERNAL_LINK_ICON_ATTR = "data-doc-external-link-icon";

let observerStarted = false;

function isElement(value) {
  return value instanceof Element;
}

function appendExternalIcon(link) {
  if (link.querySelector(`[${EXTERNAL_LINK_ICON_ATTR}]`)) return;

  const iconNode = jsx("span", {
    className: "external-link",
    children: icon("arrow-right-up-line", {
      className: "el-icon",
      [EXTERNAL_LINK_ICON_ATTR]: "true",
    }),
  });
  link.append(iconNode);
}

function applyLinkAttributes(link) {
  if (!isElement(link)) return;
  if (!link.matches(EXTERNAL_LINK_SELECTOR)) return;

  link.target = "_blank";
  link.rel = "noopener noreferrer";
  appendExternalIcon(link);
  link.setAttribute(EXTERNAL_LINK_READY_ATTR, "true");
}

function applyLinkAttributesIn(root = document) {
  if (isElement(root) && root.matches(EXTERNAL_LINK_SELECTOR)) {
    applyLinkAttributes(root);
  }

  root.querySelectorAll?.(EXTERNAL_LINK_SELECTOR).forEach((link) => {
    applyLinkAttributes(link);
  });
}

function applyContentLinkAttributes(root = document) {
  if (root === document) {
    document.querySelectorAll(CONTENT_SELECTOR).forEach((content) => {
      applyLinkAttributesIn(content);
    });
    return;
  }

  if (!isElement(root)) return;

  if (root.closest(CONTENT_SELECTOR)) {
    applyLinkAttributesIn(root);
    return;
  }

  root.querySelectorAll?.(CONTENT_SELECTOR).forEach((content) => {
    applyLinkAttributesIn(content);
  });
}

function watchExternalLinks() {
  if (observerStarted) return;
  if (typeof MutationObserver === "undefined") return;
  if (!document.body) return;

  observerStarted = true;
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (isElement(node)) applyContentLinkAttributes(node);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

export function initLinkAttributes(root = document) {
  applyContentLinkAttributes(root);
  if (root === document) watchExternalLinks();
}
