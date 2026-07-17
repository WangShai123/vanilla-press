import { createEffect } from "vanilla-signal";
import { Menu, createOffcanvas, createToc, icon } from "vanilla-jui";
import { joinLocalePath } from "./i18n.js";
import { localize } from "./i18n.js";
import { normalizeRel, relativeAsset } from "./path.js";

function isExternalHref(href = "") {
  return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(href) || href.startsWith("#");
}

function resolveItemHref(item, page, locale) {
  const href = item.href || item.url || "";
  if (!href || isExternalHref(href)) return href || "#";
  const localizedHref = locale ? joinLocalePath(locale, href) : href;
  return relativeAsset(page.rel, localizedHref);
}

function menuItemIsActive(item, page, locale) {
  const rawHref = item.href || item.url || "";
  const href = rawHref ? normalizeRel(locale ? joinLocalePath(locale, rawHref) : rawHref) : "";
  const rel = normalizeRel(page.rel || "");
  if (href && href === rel) return true;
  return (
    Array.isArray(item.children) &&
    item.children.some((child) => menuItemIsActive(child, page, locale))
  );
}

function slugifyMenu(value) {
  return (
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

function toMenuItems(items = [], page = {}, i18n, locale) {
  return items.map((item, index) => {
    const children = Array.isArray(item.children) ? item.children : [];
    const classes = Array.isArray(item.classes) ? [...item.classes] : [];
    if (menuItemIsActive(item, page, locale)) classes.push("current-menu-item");

    return {
      id:
        item.id || `${index}-${slugifyMenu(localize(item.i18n || item.label || item.title, i18n))}`,
      title: localize(item.i18n || item.label || item.title, i18n),
      url: resolveItemHref(item, page, locale),
      target: item.target,
      classes,
      children: toMenuItems(children, page, i18n, locale),
    };
  });
}

function renderMenuItem(item, page, i18n, locale) {
  const li = document.createElement("li");
  const children = Array.isArray(item.children) ? item.children : [];
  const active = menuItemIsActive(item, page, locale);
  const classes = ["menu-item"];

  if (children.length) classes.push("menu-item-has-children");
  if (active) classes.push("current-menu-item");
  if (Array.isArray(item.classes)) classes.push(...item.classes);
  li.className = classes.join(" ");

  const link = document.createElement("a");
  link.className = "menu-link";
  link.href = resolveItemHref(item, page, locale);
  if (item.target) link.target = item.target;

  const text = document.createElement("span");
  text.className = "menu-text";
  text.textContent = localize(item.i18n || item.label || item.title, i18n);
  link.append(text);
  li.append(link);

  if (children.length) {
    const subMenu = document.createElement("ul");
    subMenu.className = "sub-menu";
    children.forEach((child) => subMenu.append(renderMenuItem(child, page, i18n, locale)));
    li.append(subMenu);
  }

  return li;
}

export function initHeaderMenu(menuItems = [], page = {}, i18n, locale = null) {
  const nav = document.querySelector("[data-doc-menu]");
  if (!nav || nav.dataset.docReady === "true") return;

  nav.classList.add("j-menu");
  createEffect(() => {
    nav.textContent = "";
    const list = document.createElement("ul");
    list.className = "menu";
    menuItems.forEach((item) => list.append(renderMenuItem(item, page, i18n, locale)));
    nav.append(list);
  });

  nav.dataset.docReady = "true";
}

export function initMobileHeader(menuItems = [], page = {}, i18n, locale = null) {
  const header = document.querySelector("[data-doc-mobile-header]");
  const menuButton = document.querySelector("[data-doc-mobile-menu]");
  if (!header || !menuButton || header.dataset.docReady === "true") return;

  header.hidden = false;
  menuButton.textContent = "";
  menuButton.append(icon("menu", { className: "el-icon" }));

  const panel = document.createElement("div");
  panel.className = "doc-mobile-menu-panel";
  let menu = null;

  const destroyMenu = () => {
    menu?.destroy();
    menu = null;
    panel.textContent = "";
  };

  const drawer = createOffcanvas({
    direction: "left",
    content: panel,
    onShow: () => {
      destroyMenu();
      menu = new Menu({
        type: "mobile",
        items: toMenuItems(menuItems, page, i18n, locale),
      }).build();
      panel.append(menu.dom.root);
    },
    onHidden: destroyMenu,
  });

  panel.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (link && link.getAttribute("href") !== "#") void drawer.hide();
  });
  menuButton.addEventListener("click", () => drawer.show());
  header.dataset.docReady = "true";
}

function renderSidebarItem(item, page, i18n, locale) {
  const children = Array.isArray(item.children) ? item.children : [];
  const wrapper = document.createElement(children.length ? "div" : "a");
  const active = menuItemIsActive(item, page, locale);

  wrapper.className = children.length
    ? `doc-nav-group${active ? " is-active" : ""}`
    : `doc-nav-link${active ? " is-active" : ""}`;

  if (!children.length) {
    wrapper.href = resolveItemHref(item, page, locale);
    wrapper.textContent = localize(item.i18n || item.label || item.title, i18n);
    return wrapper;
  }

  const title = document.createElement("div");
  title.className = "doc-nav-group-title";
  title.textContent = localize(item.i18n || item.label || item.title, i18n);
  wrapper.append(title);

  const list = document.createElement("div");
  list.className = "doc-nav-group-items";
  children.forEach((child) => list.append(renderSidebarItem(child, page, i18n, locale)));
  wrapper.append(list);
  return wrapper;
}

function renderSidebar(sidebarItems = [], page = {}, i18n, locale) {
  const nav = document.createElement("nav");
  nav.className = "doc-nav";
  nav.setAttribute("aria-label", "文档导航");
  sidebarItems.forEach((item) => nav.append(renderSidebarItem(item, page, i18n, locale)));
  return nav;
}

export function initSidebar(sidebarItems = [], page = {}, i18n, locale = null) {
  const nav = document.querySelector("[data-doc-sidebar]");
  if (!nav || nav.dataset.docReady === "true") return;

  createEffect(() => {
    nav.textContent = "";
    sidebarItems.forEach((item) => nav.append(renderSidebarItem(item, page, i18n, locale)));
  });

  nav.dataset.docReady = "true";
}

export function initMobileSecondary(sidebarItems = [], page = {}, i18n, locale = null) {
  const secondary = document.querySelector("[data-doc-mobile-secondary]");
  const sidebarButton = document.querySelector("[data-doc-mobile-sidebar]");
  const tocButton = document.querySelector("[data-doc-mobile-toc]");
  if (!secondary || !sidebarButton || !tocButton || secondary.dataset.docReady === "true") {
    return;
  }

  secondary.hidden = false;
  sidebarButton.textContent = "";
  sidebarButton.append(icon("align-left", { className: "el-icon el-prefix" }));
  sidebarButton.append(document.createTextNode("导航"));
  tocButton.textContent = "";
  tocButton.append(document.createTextNode("目录"));
  tocButton.append(icon("align-right", { className: "el-icon el-suffix" }));

  const sidebarPanel = document.createElement("div");
  sidebarPanel.className = "doc-mobile-sidebar-panel";
  sidebarPanel.append(renderSidebar(sidebarItems, page, i18n, locale));
  const sidebarDrawer = createOffcanvas({
    direction: "left",
    content: sidebarPanel,
  });

  sidebarPanel.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (link && link.getAttribute("href") !== "#") void sidebarDrawer.hide();
  });
  sidebarButton.addEventListener("click", () => sidebarDrawer.show());

  const tocPanel = document.createElement("div");
  tocPanel.className = "doc-mobile-toc-panel";
  const article = document.querySelector(".j-content");
  if (article?.querySelector("h2, h3")) {
    createToc({
      container: tocPanel,
      target: article,
      headings: "h2, h3",
      offset: 80,
    }).build();
  } else {
    tocButton.hidden = true;
  }

  const tocDrawer = createOffcanvas({
    direction: "right",
    content: tocPanel,
  });
  tocPanel.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link) void tocDrawer.hide();
  });
  tocButton.addEventListener("click", () => tocDrawer.show());

  secondary.dataset.docReady = "true";
}
