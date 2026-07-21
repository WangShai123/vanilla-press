import { relativeAsset } from "../../utilities/path.js";

function renderHeaderMenu(menuEnabled) {
  return menuEnabled ? '      <nav class="doc-menu" data-doc-menu aria-label="主菜单"></nav>' : "";
}

function renderDesktopSearch(searchEnabled) {
  return searchEnabled
    ? '        <button class="doc-search-button j-button is-ghost is-icon" type="button" data-doc-search hidden aria-label="搜索"></button>'
    : "";
}

function renderDesktopLocale(i18nEnabled) {
  return i18nEnabled
    ? '        <select class="doc-locale j-select" data-doc-locale aria-label="切换语言" id="doc-locale-desktop"></select>'
    : "";
}

function renderDesktopTheme(themeEnabled) {
  return themeEnabled
    ? '<button class="doc-theme-button j-button is-default" type="button" data-doc-theme hidden></button>'
    : "";
}

function renderDesktopHeader({ rel, menuEnabled, searchEnabled, i18nEnabled, themeEnabled }) {
  const headerMenu = renderHeaderMenu(menuEnabled);
  const desktopSearch = renderDesktopSearch(searchEnabled);
  const desktopLocale = renderDesktopLocale(i18nEnabled);
  const desktopTheme = renderDesktopTheme(themeEnabled);

  return `    <div class="doc-header-inner" data-doc-desktop-header>
      <a class="doc-brand" data-doc-brand href="${relativeAsset(rel, "index.html")}">Docs</a>
${headerMenu}
      <div class="doc-header-actions">
${desktopSearch}
${desktopLocale}
        ${desktopTheme}
      </div>
    </div>`;
}

function renderMobileMenu(menuEnabled) {
  return menuEnabled
    ? '        <button class="doc-mobile-icon-button j-button is-ghost is-icon" type="button" data-doc-mobile-menu aria-label="打开主菜单"></button>'
    : "";
}

function renderMobileSearch(searchEnabled) {
  return searchEnabled
    ? '        <button class="doc-search-button doc-mobile-icon-button j-button is-ghost is-icon" type="button" data-doc-search hidden aria-label="搜索"></button>'
    : "";
}

function renderMobileLocale(i18nEnabled) {
  return i18nEnabled
    ? '        <select class="doc-locale j-select is-sm" data-doc-locale aria-label="切换语言" id="doc-locale-mobile"></select>'
    : "";
}

function renderMobileTheme(themeEnabled) {
  return themeEnabled
    ? '<button class="doc-theme-button doc-mobile-icon-button j-button is-ghost is-icon" type="button" data-doc-theme hidden aria-label="主题"></button>'
    : "";
}

function renderMobileHeader({ rel, menuEnabled, searchEnabled, i18nEnabled, themeEnabled }) {
  const mobileMenu = renderMobileMenu(menuEnabled);
  const mobileSearch = renderMobileSearch(searchEnabled);
  const mobileLocale = renderMobileLocale(i18nEnabled);
  const mobileTheme = renderMobileTheme(themeEnabled);

  return `    <div class="doc-mobile-header" data-doc-mobile-header hidden>
      <div class="doc-mobile-header-main">
${mobileMenu}
        <a class="doc-brand" data-doc-brand href="${relativeAsset(rel, "index.html")}">Docs</a>
      </div>
      <div class="doc-mobile-header-actions">
${mobileSearch}
${mobileLocale}
        ${mobileTheme}
      </div>
    </div>`;
}

function renderMobileSecondary({ sidebarEnabled, tocEnabled }) {
  return sidebarEnabled || tocEnabled
    ? `    <div class="doc-mobile-secondary" data-doc-mobile-secondary hidden>
      ${sidebarEnabled ? '<button class="doc-mobile-secondary-button j-button is-ghost" type="button" data-doc-mobile-sidebar aria-label="打开文档导航"></button>' : ""}
      ${tocEnabled ? '<button class="doc-mobile-secondary-button j-button is-ghost" type="button" data-doc-mobile-toc aria-label="打开页面目录"></button>' : ""}
    </div>`
    : "";
}

export function renderHeaderTemplates(options) {
  const desktopHeader = renderDesktopHeader(options);
  const mobileHeader = renderMobileHeader(options);

  return `<template data-doc-desktop-chrome>
${desktopHeader}
  </template>
  <template data-doc-mobile-chrome>
${mobileHeader}
  </template>`;
}

export function renderSecondaryTemplate(options) {
  const mobileSecondary = renderMobileSecondary(options);
  if (!mobileSecondary) return "";

  return `<template data-doc-mobile-secondary-chrome>
${mobileSecondary}
  </template>`;
}
