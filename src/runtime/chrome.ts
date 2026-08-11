import { all, icon, isPlainObject, q } from 'vanilla-jui';
import { jsx } from 'vanilla-signal';

import type {
  DocConfig,
  DocI18n,
  LanguagesConfig,
  LocaleEntry,
  NavItem,
  RuntimePage,
  UnknownRecord,
} from '../types.ts';
import {
  isI18nEnabled,
  isMenuEnabled,
  isSidebarEnabled,
} from '../utilities/features.ts';
import { normalizeSiteName } from '../utilities/page.ts';
import { toText } from '../utilities/string.ts';
import { initAuth } from './auth.ts';
import { createDocI18n, currentLocale } from './i18n.ts';
import { initLocale, maybeRedirectToDefaultLocale } from './locale.ts';
import { initHeaderMenu, initMobileHeader, initSidebar } from './menu.ts';
import { initTheme } from './theme.ts';

type DocChromeState =
  | {
      i18n: null;
      locale: null;
      redirected: true;
    }
  | {
      i18n: DocI18n;
      locale: LocaleEntry | null;
      redirected: false;
    };

function renderFooter(
  footer: HTMLElement | null,
  config: DocConfig = {}
): void {
  if (!footer) return;

  footer.textContent = '';

  const siteName = normalizeSiteName(config);
  const year = new Date().getFullYear();
  const brand = jsx('div', { children: `${siteName} © ${year}` });
  const social = jsx('div', { className: 'footer-social' });

  const socialConfig = isPlainObject(config.social)
    ? (config.social as UnknownRecord)
    : {};

  Object.entries(socialConfig).forEach(([name, href]) => {
    const url = toText(href).trim();
    if (!url) return;

    social.append(
      jsx('a', {
        href: url,
        className: 'j-button is-icon is-sm is-ghost',
        target: '_blank',
        rel: 'noreferrer noopener',
        'aria-label': name,
        title: name,
        children: icon(name, { className: 'el-icon' }),
      })
    );
  });

  const builtBy = jsx('div', {
    children: [
      'BuiltBy ',
      jsx('a', {
        href: 'https://github.com/WangShai123/vanilla-press',
        target: '_blank',
        rel: 'noreferrer noopener',
        children: 'VanillaPress',
      }),
    ],
  });

  footer.append(brand, social, builtBy);
}

export function initDocChrome(
  config: DocConfig = {},
  menu: NavItem[] = [],
  sidebar: NavItem[] = [],
  languages: LanguagesConfig = {},
  page: RuntimePage = {},
  mobile = false
): DocChromeState {
  if (maybeRedirectToDefaultLocale(config, languages, page)) {
    return { i18n: null, locale: null, redirected: true };
  }

  const i18nEnabled = isI18nEnabled(config);
  const locale = i18nEnabled ? currentLocale(languages, page) : null;
  const i18n = createDocI18n(languages, page);

  const desktopHeader = q<HTMLElement>('[data-doc-desktop-header]');
  const mobileHeader = q<HTMLElement>('[data-doc-mobile-header]');
  if (desktopHeader) desktopHeader.hidden = mobile;
  if (mobileHeader) mobileHeader.hidden = !mobile;
  const siteName = normalizeSiteName(config);

  all<HTMLElement>('[data-doc-brand]').forEach((brand) => {
    brand.textContent = siteName;
  });

  const footer = q<HTMLElement>('[data-doc-footer]');
  renderFooter(footer, config);

  const asideCustom = q<HTMLElement>('[data-doc-aside-custom]');
  if (asideCustom && config.aside?.html) {
    asideCustom.innerHTML = config.aside.html;
  }

  if (mobile && isMenuEnabled(config)) {
    initMobileHeader(menu, page, i18n, locale);
  } else if (!mobile) {
    if (isMenuEnabled(config)) initHeaderMenu(menu, page, i18n, locale);
    if (isSidebarEnabled(config)) initSidebar(sidebar, page, i18n, locale);
  }
  if (i18nEnabled) initLocale(languages, page, i18n, config);
  initTheme(config, i18n);
  initAuth(config, i18n);

  return { i18n, locale, redirected: false };
}
