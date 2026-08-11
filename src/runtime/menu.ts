import {
  createMenu,
  createOffcanvas,
  createToc,
  icon,
  q,
  type Menu,
  type MenuItem,
} from 'vanilla-jui';
import { createEffect, jsx } from 'vanilla-signal';
import { t as s } from 'vanilla-signal-i18n';

import type {
  DocConfig,
  DocI18n,
  LocaleEntry,
  NavItem,
  RuntimePage,
} from '../types.ts';
import {
  isSidebarEnabled,
  isTocEnabled,
  tocOptions,
} from '../utilities/features.ts';
import { toText } from '../utilities/string.ts';
import { joinLocalePath } from './i18n.ts';
import { localize } from './i18n.ts';
import { normalizeRel, relativeAsset } from './path.ts';
const l = {
  zh: { Back: '返回' },
};
const t = (key: string): string => s(key, l);

function rawItemPath(item: NavItem = {}): unknown {
  return item.path ?? item.href ?? item.url ?? '';
}

function isExternalPath(value: unknown = ''): boolean {
  const path = toText(value);
  return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(path) || path.startsWith('#');
}

function normalizePagePath(value: unknown = ''): string {
  const path = toText(value).trim();
  if (!path || isExternalPath(path)) return path;
  const clean = path.replace(/^\/+/, '');
  if (clean.endsWith('/')) return `${clean}index.html`;
  if (/\.[a-z0-9]+$/i.test(clean)) return clean;
  return `${clean}.html`;
}

function resolveItemHref(
  item: NavItem,
  page: RuntimePage,
  locale: LocaleEntry | null
): string {
  const itemPath = rawItemPath(item);
  const href = normalizePagePath(itemPath);
  if (!href || isExternalPath(href)) return href;
  const localizedHref = locale ? joinLocalePath(locale, href) : href;
  return relativeAsset(page.rel, localizedHref);
}

function menuItemIsActive(
  item: NavItem,
  page: RuntimePage,
  locale: LocaleEntry | null
): boolean {
  const itemPath = normalizePagePath(rawItemPath(item));
  const href =
    itemPath && !isExternalPath(itemPath)
      ? normalizeRel(locale ? joinLocalePath(locale, itemPath) : itemPath)
      : '';
  const rel = normalizeRel(page.rel || '');
  if (href && href === rel) return true;
  return (
    Array.isArray(item.children) &&
    item.children.some((child) => menuItemIsActive(child, page, locale))
  );
}

function slugifyMenu(value: unknown): string {
  return (
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}

function translate(key: string, fallback: string, i18n: DocI18n): string {
  const text = localize(key, i18n);
  return text && text !== key ? text : fallback;
}

function toMenuItems(
  items: NavItem[] = [],
  page: RuntimePage = {},
  i18n: DocI18n,
  locale: LocaleEntry | null
): MenuItem[] {
  return items.map((item, index) => {
    const children = Array.isArray(item.children) ? item.children : [];
    const classes = Array.isArray(item.classes) ? [...item.classes] : [];
    if (menuItemIsActive(item, page, locale)) classes.push('current-menu-item');

    return {
      id:
        item.id ||
        `${index}-${slugifyMenu(localize(item.i18n || item.label || item.title, i18n))}`,
      title: localize(item.i18n || item.label || item.title, i18n),
      url: resolveItemHref(item, page, locale),
      target: item.target,
      classes,
      children: toMenuItems(children, page, i18n, locale),
    };
  });
}

function renderMenuItem(
  item: NavItem,
  page: RuntimePage,
  i18n: DocI18n,
  locale: LocaleEntry | null
): HTMLElement {
  const children = Array.isArray(item.children) ? item.children : [];
  const active = menuItemIsActive(item, page, locale);
  const classes = ['menu-item'];

  if (children.length) classes.push('menu-item-has-children');
  if (active) classes.push('current-menu-item');
  if (Array.isArray(item.classes)) classes.push(...item.classes);

  const href = resolveItemHref(item, page, locale);

  return jsx('li', {
    className: classes.join(' '),
    children: [
      jsx('a', {
        className: 'menu-link',
        ...(href ? { href } : {}),
        ...(item.target ? { target: item.target } : {}),
        children: jsx('span', {
          className: 'menu-text',
          children: localize(item.i18n || item.label || item.title, i18n),
        }),
      }),
      children.length
        ? jsx('ul', {
            className: 'sub-menu',
            children: children.map((child) =>
              renderMenuItem(child, page, i18n, locale)
            ),
          })
        : null,
    ],
  });
}

export function initHeaderMenu(
  menuItems: NavItem[] = [],
  page: RuntimePage = {},
  i18n: DocI18n,
  locale: LocaleEntry | null = null
): void {
  const nav = q<HTMLElement>('[data-doc-menu]');
  if (!nav || nav.dataset.docReady === 'true') return;

  nav.classList.add('j-menu');
  createEffect(() => {
    nav.textContent = '';
    nav.append(
      jsx('ul', {
        className: 'menu',
        children: menuItems.map((item) =>
          renderMenuItem(item, page, i18n, locale)
        ),
      })
    );
  });

  nav.dataset.docReady = 'true';
}

export function initMobileHeader(
  menuItems: NavItem[] = [],
  page: RuntimePage = {},
  i18n: DocI18n,
  locale: LocaleEntry | null = null
): void {
  const header = q<HTMLElement>('[data-doc-mobile-header]');
  const menuButton = q<HTMLButtonElement>('[data-doc-mobile-menu]');
  if (!header || !menuButton || header.dataset.docReady === 'true') return;

  header.hidden = false;
  menuButton.textContent = '';
  menuButton.append(icon('menu', { className: 'el-icon' }));

  const panel = jsx('div', { className: 'doc-mobile-menu-panel' });
  let menu: Menu | null = null;

  const destroyMenu = (): void => {
    menu?.destroy();
    menu = null;
    panel.textContent = '';
  };

  const drawer = createOffcanvas({
    direction: 'left',
    content: panel,
    onShow: () => {
      destroyMenu();
      const nextMenu = createMenu({
        backText: t('Back'),
        type: 'mobile',
        data: toMenuItems(menuItems, page, i18n, locale),
      });
      menu = nextMenu;
      nextMenu.mount(panel);
    },
    onHidden: destroyMenu,
  }).build();

  menuButton.addEventListener('click', () => drawer.show());
  header.dataset.docReady = 'true';
}

function renderSidebarItem(
  item: NavItem,
  page: RuntimePage,
  i18n: DocI18n,
  locale: LocaleEntry | null
): HTMLElement {
  const children = Array.isArray(item.children) ? item.children : [];
  const active = menuItemIsActive(item, page, locale);
  const collapsed = children.length && item.collapse === true && !active;
  const className = children.length
    ? `doc-nav-item has-children${active ? ' is-active' : ''}${collapsed ? ' is-collapsed' : ''}`
    : `doc-nav-item${active ? ' is-active' : ''}`;

  const href = resolveItemHref(item, page, locale);
  const titleText = localize(item.i18n || item.label || item.title, i18n);
  const title = jsx('a', {
    className: `doc-nav-title${active ? ' is-active' : ''}`,
    ...(href ? { href } : {}),
    children: titleText,
  });

  if (!children.length) {
    return jsx('div', {
      className,
      children: title,
    });
  }

  const toggle = jsx('button', {
    className: 'doc-nav-toggle j-button is-ghost is-icon',
    type: 'button',
    'aria-label': titleText,
    'aria-expanded': String(!collapsed),
    children: icon('arrow-down', { className: 'el-icon' }),
  });
  const list = jsx('div', {
    className: 'doc-nav-children',
    hidden: collapsed,
    children: children.map((child) =>
      renderSidebarItem(child, page, i18n, locale)
    ),
  });
  const wrapper = jsx('div', {
    className,
    children: [title, toggle, list],
  });

  toggle.addEventListener('click', () => {
    const next = !wrapper.classList.contains('is-collapsed');
    wrapper.classList.toggle('is-collapsed', next);
    list.hidden = next;
    toggle.setAttribute('aria-expanded', String(!next));
  });

  if (!href) {
    title.addEventListener('click', () => {
      toggle.click();
    });
  }
  return wrapper;
}

function renderSidebar(
  sidebarItems: NavItem[] = [],
  page: RuntimePage = {},
  i18n: DocI18n,
  locale: LocaleEntry | null
): HTMLElement {
  return jsx('nav', {
    className: 'doc-nav',
    'aria-label': '文档导航',
    children: sidebarItems.map((item) =>
      renderSidebarItem(item, page, i18n, locale)
    ),
  });
}

export function initSidebar(
  sidebarItems: NavItem[] = [],
  page: RuntimePage = {},
  i18n: DocI18n,
  locale: LocaleEntry | null = null
): void {
  const nav = q<HTMLElement>('[data-doc-sidebar]');
  if (!nav || nav.dataset.docReady === 'true') return;

  createEffect(() => {
    nav.textContent = '';
    sidebarItems.forEach((item) =>
      nav.append(renderSidebarItem(item, page, i18n, locale))
    );
  });

  nav.dataset.docReady = 'true';
}

export function initMobileSecondary(
  sidebarItems: NavItem[] = [],
  page: RuntimePage = {},
  i18n: DocI18n,
  locale: LocaleEntry | null = null,
  config: DocConfig = {}
): void {
  const secondary = q<HTMLElement>('[data-doc-mobile-secondary]');
  const sidebarButton = q<HTMLButtonElement>('[data-doc-mobile-sidebar]');
  const tocButton = q<HTMLButtonElement>('[data-doc-mobile-toc]');
  if (!secondary || secondary.dataset.docReady === 'true') {
    return;
  }

  secondary.hidden = false;
  const sidebarLabel = translate('mobile.navigation', '导航', i18n);
  const tocLabel = translate('mobile.toc', '目录', i18n);

  if (sidebarButton && isSidebarEnabled(config)) {
    sidebarButton.textContent = '';
    sidebarButton.setAttribute('aria-label', sidebarLabel);
    sidebarButton.append(
      icon('align-left', { className: 'el-icon el-prefix' })
    );
    sidebarButton.append(sidebarLabel);

    const sidebarPanel = jsx('div', {
      className: 'doc-mobile-sidebar-panel',
      children: renderSidebar(sidebarItems, page, i18n, locale),
    });
    const sidebarDrawer = createOffcanvas({
      direction: 'left',
      content: sidebarPanel,
    }).build();

    sidebarButton.addEventListener('click', () => sidebarDrawer.show());
  }

  if (tocButton && isTocEnabled(config)) {
    tocButton.textContent = '';
    tocButton.setAttribute('aria-label', tocLabel);
    tocButton.append(tocLabel);
    tocButton.append(icon('align-right', { className: 'el-icon el-suffix' }));

    const tocPanel = jsx('div', { className: 'doc-mobile-toc-panel' });
    const article = q<HTMLElement>('.j-content');
    const { headings, offset } = tocOptions(config);
    if (article && q(headings, article)) {
      const toc = createToc({
        target: article,
        headings,
        offset,
      });
      toc.mount(tocPanel);
    } else {
      tocButton.hidden = true;
    }

    const tocDrawer = createOffcanvas({
      direction: 'right',
      content: tocPanel,
    }).build();
    tocPanel.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest('a[href^="#"]');
      if (link) void tocDrawer.hide();
    });
    tocButton.addEventListener('click', () => tocDrawer.show());
  }

  secondary.dataset.docReady = 'true';
}
