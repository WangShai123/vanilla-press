import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function cleanHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "a",
      "blockquote",
      "br",
      "button",
      "code",
      "del",
      "div",
      "em",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      "img",
      "li",
      "ol",
      "p",
      "pre",
      "span",
      "strong",
      "table",
      "tbody",
      "td",
      "th",
      "thead",
      "tr",
      "ul",
    ],
    ALLOWED_ATTR: [
      "alt",
      "aria-expanded",
      "class",
      "data-component",
      "data-direction",
      "data-doc-accordion-item",
      "data-doc-component",
      "data-doc-offcanvas-content",
      "data-doc-offcanvas-trigger",
      "data-doc-tab",
      "data-title",
      "hidden",
      "href",
      "id",
      "rel",
      "src",
      "target",
      "type",
    ],
    ALLOW_DATA_ATTR: true,
  });
}

export function htmlText(html) {
  const dom = new JSDOM(`<main>${html}</main>`);
  return (dom.window.document.querySelector("main")?.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}
