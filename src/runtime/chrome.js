import { createEffect } from 'vanilla-signal';
import { createDocI18n, localize } from './i18n.js';
import { initLocale } from './locale.js';
import {
  initHeaderMenu,
  initMobileHeader,
  initSidebar,
} from './menu.js';
import { initTheme } from './theme.js';

export function initDocChrome(config = {}, menu = [], sidebar = [], languages = {}, page = {}, mobile = false) {
  const i18n = createDocI18n(languages, page);
  const html = document.documentElement;
  html.classList.toggle('doc-is-mobile', mobile);
  html.classList.toggle('doc-is-desktop', !mobile);

  const desktopHeader = document.querySelector('[data-doc-desktop-header]');
  const mobileHeader = document.querySelector('[data-doc-mobile-header]');
  if (desktopHeader) desktopHeader.hidden = mobile;
  if (mobileHeader) mobileHeader.hidden = !mobile;

  document.querySelectorAll('[data-doc-brand]').forEach((brand) => {
    brand.textContent = config.siteName || 'Docs';
  });

  const footer = document.querySelector('[data-doc-footer]');
  if (footer) {
    createEffect(() => {
      footer.textContent = localize(config.footer?.text || '', i18n);
    });
  }

  const asideCustom = document.querySelector('[data-doc-aside-custom]');
  if (asideCustom && config.aside?.html) {
    asideCustom.innerHTML = config.aside.html;
  }

  if (mobile) {
    initMobileHeader(menu, page, i18n);
  } else {
    initHeaderMenu(menu, page, i18n);
    initSidebar(sidebar, page, i18n);
  }
  initLocale(languages, page, i18n);
  initTheme(config, i18n);

  return { i18n };
}

