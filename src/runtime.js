import { initAccordion } from './components/accordion.js';
import { initOffcanvas } from './components/offcanvas.js';
import { initTabs } from './components/tabs.js';

const initializers = {
  accordion: initAccordion,
  offcanvas: initOffcanvas,
  tabs: initTabs,
};

export function initDocPage(options = {}) {
  const components = Array.isArray(options.components)
    ? options.components
    : Object.keys(initializers);

  for (const name of components) {
    initializers[name]?.(document);
  }
}
