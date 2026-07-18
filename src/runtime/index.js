import { isMobile } from "vanilla-jui";
import "./icons.js";
import { initAccordion } from "../components/accordion.js";
import { initOffcanvas } from "../components/offcanvas.js";
import { initTabs } from "../components/tabs.js";
import { initTree } from "../components/tree.js";
import { initDocChrome } from "./chrome.js";
import { initMobileSecondary } from "./menu.js";
import { initPrevNext } from "./prev-next.js";
import { initSearch } from "./search.js";
import { initSeo } from "./seo.js";
import { initToc } from "./toc.js";

const componentRegistry = {
  tabs: {
    init: initTabs,
    dependsOn: [],
  },
  accordion: {
    init: initAccordion,
    dependsOn: ["tabs"],
  },
  offcanvas: {
    init: initOffcanvas,
    dependsOn: ["tabs"],
  },
  tree: {
    init: initTree,
    dependsOn: [],
  },
};

function expandWithDependencies(names) {
  const result = new Set();
  const stack = [...names];

  while (stack.length) {
    const name = stack.pop();
    const entry = componentRegistry[name];
    if (!entry || result.has(name)) continue;

    result.add(name);
    for (const dependency of entry.dependsOn) {
      if (!result.has(dependency)) stack.push(dependency);
    }
  }

  return Array.from(result);
}

function normalizeComponents(value) {
  const names = Array.isArray(value) ? value : Object.keys(componentRegistry);
  const seen = new Set();
  const result = [];

  for (const name of names) {
    if (!componentRegistry[name] || seen.has(name)) continue;
    seen.add(name);
    result.push(name);
  }

  return result;
}

function resolveExecutionOrder(names) {
  const selected = new Set(expandWithDependencies(names));
  const visiting = new Set();
  const visited = new Set();
  const order = [];

  const visit = (name) => {
    if (!selected.has(name) || visited.has(name)) return;
    if (visiting.has(name)) return;

    visiting.add(name);

    for (const dependency of componentRegistry[name].dependsOn) {
      visit(dependency);
    }

    visiting.delete(name);
    visited.add(name);
    order.push(name);
  };

  for (const name of selected) {
    visit(name);
  }

  return order;
}

function countPending(root, name) {
  return root.querySelectorAll(`[data-doc-component="${name}"]:not([data-doc-ready="true"])`)
    .length;
}

function hasPending(root, names) {
  return names.some((name) => countPending(root, name) > 0);
}

function nodeContainsComponents(node) {
  if (!(node instanceof Element)) return false;
  if (node.hasAttribute("data-doc-component")) return true;
  return Boolean(node.querySelector("[data-doc-component]"));
}

function initComponents(root, names, config = {}, maxPasses = 5) {
  const ordered = resolveExecutionOrder(names);

  for (let pass = 0; pass < maxPasses; pass += 1) {
    let progressed = false;

    for (const name of ordered) {
      const init = componentRegistry[name]?.init;
      if (!init) continue;

      const before = countPending(root, name);
      if (!before) continue;

      init(root, config);

      const after = countPending(root, name);
      if (after < before) progressed = true;
    }

    if (!progressed) break;
  }
}

function watchDynamicComponents(names, config = {}) {
  if (typeof MutationObserver === "undefined") return;
  if (!document.body) return;

  let scheduled = false;
  const rerun = () => {
    scheduled = false;
    if (!hasPending(document, names)) return;
    initComponents(document, names, config);
  };

  const observer = new MutationObserver((records) => {
    const found = records.some((record) =>
      Array.from(record.addedNodes).some((node) => nodeContainsComponents(node)),
    );

    if (!found || scheduled) return;
    scheduled = true;
    queueMicrotask(rerun);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function isSearchEnabled(config = {}) {
  return config.search !== false;
}

function isSidebarEnabled(config = {}) {
  return config.sidebar !== false;
}

function isTocEnabled(config = {}) {
  if (config.toc === false) return false;
  return config.toc?.enabled !== false;
}

function isPrevNextEnabled(config = {}) {
  return config.prevNext === true || config.prevNext?.enabled === true;
}

export function initDocPage(options = {}) {
  const components = normalizeComponents(options.components);
  const mobile = isMobile();

  const chrome = initDocChrome(
    options.config,
    options.menu,
    options.sidebar,
    options.languages,
    options.page,
    mobile,
  );

  if (chrome?.redirected) return;

  initSeo(options.config, options.page);
  if (isSearchEnabled(options.config)) {
    initSearch(options.config, options.search, options.page, chrome.i18n, chrome.locale);
  }
  initComponents(document, components, options.config);
  watchDynamicComponents(components, options.config);

  if (mobile) {
    if (isSidebarEnabled(options.config) || isTocEnabled(options.config)) {
      initMobileSecondary(options.sidebar, options.page, chrome.i18n, chrome.locale, options.config);
    }
  } else if (isTocEnabled(options.config)) {
    initToc(options.config);
  }

  if (isPrevNextEnabled(options.config)) {
    initPrevNext(options.config, options.sidebar, options.page, chrome.i18n, chrome.locale);
  }
}
