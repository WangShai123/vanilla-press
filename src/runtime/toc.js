import { createToc } from "vanilla-jui";
import { tocOptions } from "../utilities/features.js";

export function initToc(config = {}) {
  const toc = document.querySelector("[data-doc-toc]");
  const article = document.querySelector(".j-content");
  if (!toc || !article || toc.dataset.docReady === "true") return;

  const { headings } = tocOptions(config);
  if (!article.querySelector(headings)) {
    toc.hidden = true;
    return;
  }

  createToc({
    container: toc,
    target: article,
    headings,
    offset: 80,
  }).build();
  toc.dataset.docReady = "true";
}
