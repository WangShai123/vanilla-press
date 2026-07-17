import { isMobile } from 'vanilla-jui';
import './icons.js';
import { initAccordion } from '../components/accordion.js';
import { initOffcanvas } from '../components/offcanvas.js';
import { initTabs } from '../components/tabs.js';
import { initDocChrome } from './chrome.js';
import { initMobileSecondary } from './menu.js';
import { initToc } from './toc.js';

const initializers = {
  accordion: initAccordion,
  offcanvas: initOffcanvas,
  tabs: initTabs,
};

export function initDocPage(options = {}) {
  const components = Array.isArray(options.components)
    ? options.components
    : Object.keys(initializers);
  const mobile = isMobile();

  const chrome = initDocChrome(
    options.config,
    options.menu,
    options.sidebar,
    options.languages,
    options.page,
    mobile
  );

  for (const name of components) {
    initializers[name]?.(document);
  }

  if (mobile) {
    initMobileSecondary(options.sidebar, options.page, chrome.i18n);
  } else {
    initToc();
  }
}

