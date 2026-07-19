import { icon, isPlainObject } from "vanilla-jui";
import { createDocI18n, currentLocale } from "./i18n.js";
import { initLocale, maybeRedirectToDefaultLocale } from "./locale.js";
import { initHeaderMenu, initMobileHeader, initSidebar } from "./menu.js";
import { initTheme } from "./theme.js";
import { normalizeSiteName } from "../utilities/page.js";
import { isI18nEnabled, isMenuEnabled, isSidebarEnabled } from "../utilities/features.js";
import { jsx } from "vanilla-signal";

function renderFooter(footer, config = {}) {
  if (!footer) return;

  footer.textContent = "";

  const brand = document.createElement("div");
  const siteName = normalizeSiteName(config);
  const year = new Date().getFullYear();
  brand.innerHTML = `${siteName} © ${year}`;

  const social = document.createElement("div");
  social.className = "footer-social";

  const socialConfig = isPlainObject(config.social) ? config.social : {};

  Object.entries(socialConfig).forEach(([name, href]) => {
    const url = String(href || "").trim();
    if (!url) return;

    const item = document.createElement("a");
    item.href = url;
    item.className = "j-button is-icon is-sm is-ghost";
    item.target = "_blank";
    item.rel = "noreferrer noopener";
    item.setAttribute("aria-label", name);
    item.title = name;
    item.append(icon(name, { className: "el-icon" }));
    social.append(item);
  });

  const builtBy = jsx`<div>BuiltBy <a href="https://github.com/WangShai123/vanilla-press" target="_blank" rel="noreferrer noopener">VanillaPress</a></div>`;

  footer.append(brand, social, builtBy);
}

export function initDocChrome(
  config = {},
  menu = [],
  sidebar = [],
  languages = {},
  page = {},
  mobile = false,
) {
  if (maybeRedirectToDefaultLocale(config, languages, page)) {
    return { i18n: null, locale: null, redirected: true };
  }

  const i18nEnabled = isI18nEnabled(config);
  const locale = i18nEnabled ? currentLocale(languages, page) : null;
  const i18n = createDocI18n(languages, page);

  const desktopHeader = document.querySelector("[data-doc-desktop-header]");
  const mobileHeader = document.querySelector("[data-doc-mobile-header]");
  if (desktopHeader) desktopHeader.hidden = mobile;
  if (mobileHeader) mobileHeader.hidden = !mobile;
  const siteName = normalizeSiteName(config);

  document.querySelectorAll("[data-doc-brand]").forEach((brand) => {
    brand.textContent = siteName;
  });

  const footer = document.querySelector("[data-doc-footer]");
  renderFooter(footer, config);

  const asideCustom = document.querySelector("[data-doc-aside-custom]");
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

  return { i18n, locale, redirected: false };
}
