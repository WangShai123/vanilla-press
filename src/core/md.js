import MarkdownIt from "markdown-it";
import frontMatter from "markdown-it-front-matter";
import { installAccordion } from "../components/accordion.js";
import { installOffcanvas } from "../components/offcanvas.js";
import { installTabs } from "../components/tabs.js";
import { installTree } from "../components/tree.js";
import { highlight } from "../runtime/highlight.js";
import { isHighlightEnabled } from "../utilities/features.js";
import { escapeHtml } from "../utilities/html.js";

function renderPlainCode(code, lang) {
  const language = String(lang || "").trim();
  const suffix = language ? ` class="language-${language}"` : "";
  return `<pre><code${suffix}>${escapeHtml(code)}</code></pre>`;
}

export function createMarkdown(config = {}) {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight: isHighlightEnabled(config) ? highlight : renderPlainCode,
  });

  md.use(frontMatter, () => {});
  installTabs(md);
  installAccordion(md);
  installOffcanvas(md);
  installTree(md);

  return md;
}

const md = createMarkdown();

export default md;
