import { createEffect, jsx } from "vanilla-signal";
import { Menu, createOffcanvas, createToc, icon, q } from "vanilla-jui";
import { joinLocalePath } from "./i18n.js";
import { localize } from "./i18n.js";
import { normalizeRel, relativeAsset } from "./path.js";
import { t as s } from "vanilla-signal-i18n";
import { isSidebarEnabled, isTocEnabled, tocOptions } from "../utilities/features.js";
const l = {
  zh: { Back: "返回" },
};
const t = (key) => s(key, l);

function rawItemPath(item = {}) {
  return item.path ?? item.href ?? item.url ?? "";
}

function isExternalPath(value = "") {
  return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(value) || value.startsWith("#");
}

function normalizePagePath(value = "") {
  const path = String(value || "").trim();
  if (!path || isExternalPath(path)) return path;
  const clean = path.replace(/^\/+/, "");
  if (clean.endsWith("/")) return `${clean}index.html`;
  if (/\.[a-z0-9]+$/i.test(clean)) return clean;
  return `${clean}.html`;
}

function resolveItemHref(item, page, locale) {
  const itemPath = rawItemPath(item);
  const href = normalizePagePath(itemPath);
  if (!href || isExternalPath(href)) return href;
  const localizedHref = locale ? joinLocalePath(locale, href) : href;
  return relativeAsset(page.rel, localizedHref);
}

function menuItemIsActive(item, page, locale) {
  const itemPath = normalizePagePath(rawItemPath(item));
  const href =
    itemPath && !isExternalPath(itemPath)
      ? normalizeRel(locale ? joinLocalePath(locale, itemPath) : itemPath)
      : "";
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

function translate(key, fallback, i18n) {
  const text = localize(key, i18n);
  return text && text !== key ? text : fallback;
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
  const children = Array.isArray(item.children) ? item.children : [];
  const active = menuItemIsActive(item, page, locale);
  const classes = ["menu-item"];

  if (children.length) classes.push("menu-item-has-children");
  if (active) classes.push("current-menu-item");
  if (Array.isArray(item.classes)) classes.push(...item.classes);

  const href = resolveItemHref(item, page, locale);

  return jsx("li", {
    className: classes.join(" "),
    children: [
      jsx("a", {
        className: "menu-link",
        ...(href ? { href } : {}),
        ...(item.target ? { target: item.target } : {}),
        children: jsx("span", {
          className: "menu-text",
          children: localize(item.i18n || item.label || item.title, i18n),
        }),
      }),
      children.length
        ? jsx("ul", {
            className: "sub-menu",
            children: children.map((child) => renderMenuItem(child, page, i18n, locale)),
          })
        : null,
    ],
  });
}

export function initHeaderMenu(menuItems = [], page = {}, i18n, locale = null) {
  const nav = q("[data-doc-menu]");
  if (!nav || nav.dataset.docReady === "true") return;

  nav.classList.add("j-menu");
  createEffect(() => {
    nav.textContent = "";
    nav.append(
      jsx("ul", {
        className: "menu",
        children: menuItems.map((item) => renderMenuItem(item, page, i18n, locale)),
      }),
    );
  });

  nav.dataset.docReady = "true";
}

export function initMobileHeader(menuItems = [], page = {}, i18n, locale = null) {
  const header = q("[data-doc-mobile-header]");
  const menuButton = q("[data-doc-mobile-menu]");
  if (!header || !menuButton || header.dataset.docReady === "true") return;

  header.hidden = false;
  menuButton.textContent = "";
  menuButton.append(icon("menu", { className: "el-icon" }));

  const panel = jsx("div", { className: "doc-mobile-menu-panel" });
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
        backText: t("Back"),
        type: "mobile",
        items: toMenuItems(menuItems, page, i18n, locale),
      }).build();
      panel.append(menu.dom.root);
    },
    onHidden: destroyMenu,
  });

  menuButton.addEventListener("click", () => drawer.show());
  header.dataset.docReady = "true";
}

function renderSidebarItem(item, page, i18n, locale) {
  const children = Array.isArray(item.children) ? item.children : [];
  const active = menuItemIsActive(item, page, locale);
  const collapsed = children.length && item.collapse === true && !active;
  const className = children.length
    ? `doc-nav-item has-children${active ? " is-active" : ""}${collapsed ? " is-collapsed" : ""}`
    : `doc-nav-item${active ? " is-active" : ""}`;

  const href = resolveItemHref(item, page, locale);
  const titleText = localize(item.i18n || item.label || item.title, i18n);
  const title = jsx("a", {
    className: `doc-nav-title${active ? " is-active" : ""}`,
    ...(href ? { href } : {}),
    children: titleText,
  });

  if (!children.length) {
    return jsx("div", {
      className,
      children: title,
    });
  }

  const toggle = jsx("button", {
    className: "doc-nav-toggle j-button is-ghost is-icon",
    type: "button",
    "aria-label": titleText,
    "aria-expanded": String(!collapsed),
    children: icon("arrow-down", { className: "el-icon" }),
  });
  const list = jsx("div", {
    className: "doc-nav-children",
    hidden: collapsed,
    children: children.map((child) => renderSidebarItem(child, page, i18n, locale)),
  });
  const wrapper = jsx("div", {
    className,
    children: [title, toggle, list],
  });

  toggle.addEventListener("click", () => {
    const next = !wrapper.classList.contains("is-collapsed");
    wrapper.classList.toggle("is-collapsed", next);
    list.hidden = next;
    toggle.setAttribute("aria-expanded", String(!next));
  });

  if (!href) {
    title.addEventListener("click", () => {
      toggle.click();
    });
  }
  return wrapper;
}

function renderSidebar(sidebarItems = [], page = {}, i18n, locale) {
  return jsx("nav", {
    className: "doc-nav",
    "aria-label": "文档导航",
    children: sidebarItems.map((item) => renderSidebarItem(item, page, i18n, locale)),
  });
}

export function initSidebar(sidebarItems = [], page = {}, i18n, locale = null) {
  const nav = q("[data-doc-sidebar]");
  if (!nav || nav.dataset.docReady === "true") return;

  createEffect(() => {
    nav.textContent = "";
    sidebarItems.forEach((item) => nav.append(renderSidebarItem(item, page, i18n, locale)));
  });

  nav.dataset.docReady = "true";
}

export function initMobileSecondary(
  sidebarItems = [],
  page = {},
  i18n,
  locale = null,
  config = {},
) {
  const secondary = q("[data-doc-mobile-secondary]");
  const sidebarButton = q("[data-doc-mobile-sidebar]");
  const tocButton = q("[data-doc-mobile-toc]");
  if (!secondary || secondary.dataset.docReady === "true") {
    return;
  }

  secondary.hidden = false;
  const sidebarLabel = translate("mobile.navigation", "导航", i18n);
  const tocLabel = translate("mobile.toc", "目录", i18n);

  if (sidebarButton && isSidebarEnabled(config)) {
    sidebarButton.textContent = "";
    sidebarButton.setAttribute("aria-label", sidebarLabel);
    sidebarButton.append(icon("align-left", { className: "el-icon el-prefix" }));
    sidebarButton.append(sidebarLabel);

    const sidebarPanel = jsx("div", {
      className: "doc-mobile-sidebar-panel",
      children: renderSidebar(sidebarItems, page, i18n, locale),
    });
    const sidebarDrawer = createOffcanvas({
      direction: "left",
      content: sidebarPanel,
    });

    sidebarButton.addEventListener("click", () => sidebarDrawer.show());
  }

  if (tocButton && isTocEnabled(config)) {
    tocButton.textContent = "";
    tocButton.setAttribute("aria-label", tocLabel);
    tocButton.append(tocLabel);
    tocButton.append(icon("align-right", { className: "el-icon el-suffix" }));

    const tocPanel = jsx("div", { className: "doc-mobile-toc-panel" });
    const article = q(".j-content");
    const { headings, offset } = tocOptions(config);
    if (article && q(headings, article)) {
      createToc({
        container: tocPanel,
        target: article,
        headings,
        offset,
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
  }

  secondary.dataset.docReady = "true";
}
