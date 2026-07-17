import MarkdownIt from "markdown-it";
import { installAccordion } from "../components/accordion.js";
import { highlight } from "../components/highlight.js";
import { installOffcanvas } from "../components/offcanvas.js";
import { installTabs } from "../components/tabs.js";

export function createMarkdown() {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight,
  });

  installTabs(md);
  installAccordion(md);
  installOffcanvas(md);

  return md;
}

const md = createMarkdown();

export default md;
