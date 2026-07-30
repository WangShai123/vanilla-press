import { createToc, q } from "vanilla-jui";
import { tocOptions } from "../utilities/features.js";

export function initToc(config = {}) {
  const toc = q("[data-doc-toc]");
  const article = q(".j-content");
  if (!toc || !article || toc.dataset.docReady === "true") return;

  const { headings, offset } = tocOptions(config);
  if (!q(headings, article)) {
    toc.hidden = true;
    return;
  }

  createToc({
    container: toc,
    target: article,
    headings,
    offset,
  }).build();
  toc.dataset.docReady = "true";
}
