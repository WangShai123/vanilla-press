import { createToc } from "vanilla-jui";

function tocHeadings(config = {}) {
  const toc = config.toc;
  return typeof toc?.headings === "string" && toc.headings.trim() ? toc.headings : "h2, h3";
}

export function initToc(config = {}) {
  const toc = document.querySelector("[data-doc-toc]");
  const article = document.querySelector(".j-content");
  if (!toc || !article || toc.dataset.docReady === "true") return;

  const headings = tocHeadings(config);
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
