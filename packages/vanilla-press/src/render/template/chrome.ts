import type { ChromeOptions } from '../../types.ts';

function renderHeaderMenu(menuEnabled: boolean): string {
  return menuEnabled
    ? '<nav class="doc-menu" data-vp-menu aria-label="主菜单"></nav>'
    : '';
}

function renderDesktopSearch(searchEnabled: boolean): string {
  return searchEnabled
    ? '<button class="doc-search-button j-button is-ghost is-icon" type="button" data-vp-search hidden aria-label="搜索"></button>'
    : '';
}

function renderDesktopLocale(i18nEnabled: boolean): string {
  return i18nEnabled
    ? '<select class="doc-locale j-select" data-vp-locale aria-label="切换语言" id="doc-locale-desktop"></select>'
    : '';
}

function renderDesktopTheme(themeEnabled: boolean): string {
  return themeEnabled
    ? '<button class="doc-theme-button j-button is-default" type="button" data-vp-theme hidden></button>'
    : '';
}

function renderDesktopAuth(authEnabled: boolean): string {
  return authEnabled
    ? '<button class="doc-auth-button j-button is-default" type="button" data-vp-auth hidden aria-label="登录"></button>'
    : '';
}

function renderDesktopHeader({
  brandHref,
  menuEnabled,
  searchEnabled,
  i18nEnabled,
  themeEnabled,
  authEnabled,
}: ChromeOptions): string {
  const headerMenu = renderHeaderMenu(menuEnabled);
  const desktopSearch = renderDesktopSearch(searchEnabled);
  const desktopLocale = renderDesktopLocale(i18nEnabled);
  const desktopTheme = renderDesktopTheme(themeEnabled);
  const desktopAuth = renderDesktopAuth(authEnabled);

  return `<div class="doc-header-inner" data-vp-desktop-header>
      <a class="doc-brand" data-vp-brand href="${brandHref}">Docs</a>
${headerMenu}
      <div class="doc-header-actions">
${desktopSearch}
${desktopLocale}
        ${desktopTheme}
        ${desktopAuth}
      </div>
    </div>`;
}

function renderMobileMenu(menuEnabled: boolean): string {
  return menuEnabled
    ? '<button class="doc-mobile-icon-button j-button is-ghost is-icon" type="button" data-vp-mobile-menu aria-label="打开主菜单"></button>'
    : '';
}

function renderMobileSearch(searchEnabled: boolean): string {
  return searchEnabled
    ? '<button class="doc-search-button doc-mobile-icon-button j-button is-ghost is-icon is-lg" type="button" data-vp-search hidden aria-label="搜索"></button>'
    : '';
}

function renderMobileLocale(i18nEnabled: boolean): string {
  return i18nEnabled
    ? '<select class="doc-locale j-select is-lg" data-vp-locale aria-label="切换语言" id="doc-locale-mobile"></select>'
    : '';
}

function renderMobileTheme(themeEnabled: boolean): string {
  return themeEnabled
    ? '<button class="doc-theme-button doc-mobile-icon-button j-button is-ghost is-icon is-lg" type="button" data-vp-theme hidden aria-label="主题"></button>'
    : '';
}

function renderMobileAuth(authEnabled: boolean): string {
  return authEnabled
    ? '<button class="doc-auth-button doc-mobile-icon-button j-button is-ghost is-icon is-lg" type="button" data-vp-auth hidden aria-label="登录"></button>'
    : '';
}

function renderMobileHeader({
  brandHref,
  menuEnabled,
  searchEnabled,
  i18nEnabled,
  themeEnabled,
  authEnabled,
}: ChromeOptions): string {
  const mobileMenu = renderMobileMenu(menuEnabled);
  const mobileSearch = renderMobileSearch(searchEnabled);
  const mobileLocale = renderMobileLocale(i18nEnabled);
  const mobileTheme = renderMobileTheme(themeEnabled);
  const mobileAuth = renderMobileAuth(authEnabled);

  return `<div class="doc-mobile-header" data-vp-mobile-header hidden>
      <div class="doc-mobile-header-main">
${mobileMenu}
        <a class="doc-brand" data-vp-brand href="${brandHref}">Docs</a>
      </div>
      <div class="doc-mobile-header-actions">
${mobileSearch}
${mobileLocale}
        ${mobileTheme}
        ${mobileAuth}
      </div>
    </div>`;
}

function renderMobileSecondary({
  sidebarEnabled,
  tocEnabled,
}: Pick<ChromeOptions, 'sidebarEnabled' | 'tocEnabled'>): string {
  return sidebarEnabled || tocEnabled
    ? `<div class="doc-mobile-secondary" data-vp-mobile-secondary hidden>
      ${sidebarEnabled ? '<button class="doc-mobile-secondary-button j-button is-ghost" type="button" data-vp-mobile-sidebar aria-label="打开文档导航"></button>' : ''}
      ${tocEnabled ? '<button class="doc-mobile-secondary-button j-button is-ghost" type="button" data-vp-mobile-toc aria-label="打开页面目录"></button>' : ''}
    </div>`
    : '';
}

export function renderHeaderTemplates(options: ChromeOptions): string {
  const desktopHeader = renderDesktopHeader(options);
  const mobileHeader = renderMobileHeader(options);

  return `<template data-vp-desktop-chrome>
${desktopHeader}
  </template>
  <template data-vp-mobile-chrome>
${mobileHeader}
  </template>`;
}

export function renderSecondaryTemplate(options: ChromeOptions): string {
  const mobileSecondary = renderMobileSecondary(options);
  if (!mobileSecondary) return '';

  return `<template data-vp-mobile-secondary-chrome>
${mobileSecondary}
  </template>`;
}
