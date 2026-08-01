import { all, isMobile, q } from 'vanilla-jui';

import './icons.ts';
import { initAccordion } from '../components/accordion.ts';
import { initOffcanvas } from '../components/offcanvas.ts';
import { initTabs } from '../components/tabs.ts';
import { initTip } from '../components/tip.ts';
import { initTree } from '../components/tree.ts';
import type {
  DocConfig,
  LanguagesConfig,
  NavItem,
  RuntimePage,
  SearchSource,
} from '../types.ts';
import {
  isPrevNextEnabled,
  isExternalLinkEnabled,
  isLlmsEnabled,
  isSearchEnabled,
  isSidebarEnabled,
  isTocEnabled,
} from '../utilities/features.ts';
import { initDocChrome } from './chrome.ts';
import { initLinkAttributes } from './link-attributes.ts';
import { initLlms } from './llms.ts';
import { initMobileSecondary } from './menu.ts';
import { initPrevNext } from './prev-next.ts';
import { initSearch } from './search.ts';
import { initSeo } from './seo.ts';
import { initToc } from './toc.ts';

type ComponentName = 'tabs' | 'accordion' | 'offcanvas' | 'tree' | 'tip';
type ComponentInit = (root: Document | Element, config?: DocConfig) => void;

interface ComponentRegistryEntry {
  init: ComponentInit;
  dependsOn: ComponentName[];
}

export interface DocPageOptions {
  config?: DocConfig;
  menu?: NavItem[];
  sidebar?: NavItem[];
  languages?: LanguagesConfig;
  page?: RuntimePage;
  search?: SearchSource;
  components?: unknown;
}

const componentRegistry: Record<ComponentName, ComponentRegistryEntry> = {
  tabs: {
    init: initTabs,
    dependsOn: [],
  },
  accordion: {
    init: initAccordion,
    dependsOn: ['tabs'],
  },
  offcanvas: {
    init: initOffcanvas,
    dependsOn: ['tabs'],
  },
  tree: {
    init: initTree,
    dependsOn: [],
  },
  tip: {
    init: initTip,
    dependsOn: [],
  },
};

function isComponentName(value: unknown): value is ComponentName {
  return typeof value === 'string' && value in componentRegistry;
}

function expandWithDependencies(names: ComponentName[]): ComponentName[] {
  const result = new Set<ComponentName>();
  const stack = [...names];

  while (stack.length) {
    const name = stack.pop();
    if (!name) continue;
    const entry = componentRegistry[name];
    if (result.has(name)) continue;

    result.add(name);
    for (const dependency of entry.dependsOn) {
      if (!result.has(dependency)) stack.push(dependency);
    }
  }

  return Array.from(result);
}

function normalizeComponents(value: unknown): ComponentName[] {
  const names = Array.isArray(value) ? value : Object.keys(componentRegistry);
  const seen = new Set<ComponentName>();
  const result: ComponentName[] = [];

  for (const name of names) {
    if (!isComponentName(name) || seen.has(name)) continue;
    seen.add(name);
    result.push(name);
  }

  return result;
}

function resolveExecutionOrder(names: ComponentName[]): ComponentName[] {
  const selected = new Set(expandWithDependencies(names));
  const visiting = new Set<ComponentName>();
  const visited = new Set<ComponentName>();
  const order: ComponentName[] = [];

  const visit = (name: ComponentName): void => {
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

function countPending(root: Document | Element, name: ComponentName): number {
  return all(
    `[data-doc-component="${name}"]:not([data-doc-ready="true"])`,
    root
  ).length;
}

function hasPending(root: Document | Element, names: ComponentName[]): boolean {
  return names.some((name) => countPending(root, name) > 0);
}

function nodeContainsComponents(node: Node): boolean {
  if (!(node instanceof Element)) return false;
  if (node.hasAttribute('data-doc-component')) return true;
  return Boolean(q('[data-doc-component]', node));
}

function initComponents(
  root: Document | Element,
  names: ComponentName[],
  config: DocConfig = {},
  maxPasses = 5
): void {
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

function watchDynamicComponents(
  names: ComponentName[],
  config: DocConfig = {}
): void {
  if (typeof MutationObserver === 'undefined') return;
  if (!document.body) return;

  let scheduled = false;
  const rerun = () => {
    scheduled = false;
    if (!hasPending(document, names)) return;
    initComponents(document, names, config);
  };

  const observer = new MutationObserver((records) => {
    const found = records.some((record) =>
      Array.from(record.addedNodes).some((node) => nodeContainsComponents(node))
    );

    if (!found || scheduled) return;
    scheduled = true;
    queueMicrotask(rerun);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function syncViewportClasses(mobile: boolean): void {
  const html = document.documentElement;
  html.classList.toggle('is-mobile', mobile);
  html.classList.toggle('is-desktop', !mobile);
}

export function initDocPage(options: DocPageOptions = {}): void {
  const components = normalizeComponents(options.components);
  const mobile = isMobile();
  syncViewportClasses(mobile);

  const chrome = initDocChrome(
    options.config,
    options.menu,
    options.sidebar,
    options.languages,
    options.page,
    mobile
  );

  if (chrome?.redirected) return;

  initSeo(options.config, options.page);
  if (isSearchEnabled(options.config)) {
    initSearch(
      options.config,
      options.search,
      options.page,
      chrome.i18n,
      chrome.locale
    );
  }
  if (isLlmsEnabled(options.config)) {
    initLlms();
  }
  if (isExternalLinkEnabled(options.config)) {
    initLinkAttributes();
  }
  initComponents(document, components, options.config);
  watchDynamicComponents(components, options.config);

  if (mobile) {
    if (isSidebarEnabled(options.config) || isTocEnabled(options.config)) {
      initMobileSecondary(
        options.sidebar,
        options.page,
        chrome.i18n,
        chrome.locale,
        options.config
      );
    }
  } else if (isTocEnabled(options.config)) {
    initToc(options.config);
  }

  if (isPrevNextEnabled(options.config)) {
    initPrevNext(
      options.config,
      options.sidebar,
      options.page,
      chrome.i18n,
      chrome.locale
    );
  }
}
