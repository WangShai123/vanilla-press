import { JSDOM } from "jsdom";
import { llmsOptions } from "./features.js";

export const DEFAULT_LLMS_CONTAINER_LABELS = {
  "zh-CN": {
    link: "查看 Markdown",
    copy: "复制 Markdown 链接",
    chatgpt: "在 ChatGPT 中打开",
    claude: "在 Claude 中打开",
    options: "LLMs",
  },
  en: {
    link: "View Markdown",
    copy: "Copy Markdown link",
    chatgpt: "Open in ChatGPT",
    claude: "Open in Claude",
    options: "LLMs",
  },
};

function cleanValue(value) {
  if (value === false || value === undefined || value === null) return null;
  const text = String(value ?? "").trim();
  return text || null;
}

function baseUrl(siteUrl) {
  const value = cleanValue(siteUrl);
  return value ? value.replace(/\/+$/g, "") : "";
}

function encodeRoute(route) {
  return String(route || "")
    .replace(/^\/+/, "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

function normalizeRel(value = "") {
  return String(value || "")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
}

function localeCode(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function markdownRouteRel(page = {}) {
  return String(page.rel || "").replace(/\.html$/i, ".md");
}

export function markdownRouteUrl(page = {}, siteConfig = {}) {
  const base = baseUrl(siteConfig.siteUrl);
  const route = encodeRoute(markdownRouteRel(page));
  return base ? `${base}/${route}` : route;
}

export function renderLlmsTxt(config = {}, siteConfig = {}, pages = []) {
  const title = cleanValue(config.title) || cleanValue(siteConfig.siteName) || "Docs";
  const description = cleanValue(config.description);
  const sectionTitle = cleanValue(config.sectionTitle) || "Docs";
  const lines = [`# ${title}`];

  if (description) {
    lines.push("", description);
  }

  lines.push("", `## ${sectionTitle}`);

  for (const page of pages) {
    lines.push(`- ${markdownRouteUrl(page, siteConfig)}`);
  }

  return `${lines.join("\n").trim()}\n`;
}

function hasVisibleControls(options = {}) {
  return Boolean(options.enabled && (options.link || options.copy || options.chatgpt || options.claude));
}

function pageLocaleCode(languages = {}, page = {}) {
  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  const rel = normalizeRel(page.rel || "index.html");
  const sorted = [...locales].sort(
    (a, b) => normalizeRel(b.path).length - normalizeRel(a.path).length,
  );
  const matched = sorted.find((locale) => {
    const prefix = normalizeRel(locale.path);
    return prefix && (rel === `${prefix}/index.html` || rel.startsWith(`${prefix}/`));
  });

  return matched?.code || languages.locale || languages.fallbackLocale || "en";
}

function localeLabels(labels = {}, locale) {
  const key = String(locale || "");
  const lowerKey = localeCode(key);

  return (
    labels[key] ||
    Object.entries(labels).find(([candidate]) => localeCode(candidate) === lowerKey)?.[1] ||
    labels.en ||
    labels["zh-CN"] ||
    Object.values(labels).find(isPlainObject) ||
    {}
  );
}

export function llmsContainerLabels(config = {}, languages = {}, page = {}) {
  const configuredLabels = isPlainObject(config.container?.labels) ? config.container.labels : {};
  const labels = {
    ...DEFAULT_LLMS_CONTAINER_LABELS,
    ...configuredLabels,
  };
  const locale = pageLocaleCode(languages, page);
  const defaults = localeLabels(DEFAULT_LLMS_CONTAINER_LABELS, locale);
  const selected = localeLabels(labels, locale);

  return {
    link: cleanValue(selected.link) || defaults.link,
    copy: cleanValue(selected.copy) || defaults.copy,
    chatgpt: cleanValue(selected.chatgpt) || defaults.chatgpt,
    claude: cleanValue(selected.claude) || defaults.claude,
    options: cleanValue(selected.options) || defaults.options,
  };
}

function setBooleanData(element, name, value) {
  element.setAttribute(name, value ? "true" : "false");
}

function createIconSlot(document, name) {
  const slot = document.createElement("span");
  slot.className = "el-prefix";
  slot.setAttribute("data-doc-llms-icon", name);
  return slot;
}

function createButtonText(document, text) {
  const span = document.createElement("span");
  span.className = "button-text";
  span.textContent = text;
  return span;
}

function createLinkButton(document, labels) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "j-button is-default";
  button.setAttribute("data-doc-llms-link", "");
  button.append(createIconSlot(document, "file"), createButtonText(document, labels.link));
  return button;
}

function createOptionsButton(document, labels) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "j-button is-default is-icon llms-options-trigger";
  button.setAttribute("data-doc-llms-options-trigger", "");
  button.setAttribute("aria-label", labels.options);
  button.append(createIconSlot(document, "arrow-down"));
  return button;
}

function createLlmsContainer(document, page = {}, siteConfig = {}, llmsConfig = {}, languages = {}) {
  const options = llmsOptions(siteConfig);
  if (!hasVisibleControls(options)) return null;

  const labels = llmsContainerLabels(llmsConfig, languages, page);
  const container = document.createElement("div");
  container.className = "llms-container";
  container.setAttribute("data-doc-llms", "");
  container.setAttribute("data-doc-llms-md-url", markdownRouteUrl(page, siteConfig));
  container.setAttribute("data-doc-llms-label-link", labels.link);
  container.setAttribute("data-doc-llms-label-copy", labels.copy);
  container.setAttribute("data-doc-llms-label-chatgpt", labels.chatgpt);
  container.setAttribute("data-doc-llms-label-claude", labels.claude);
  container.setAttribute("data-doc-llms-label-options", labels.options);
  setBooleanData(container, "data-doc-llms-copy", options.copy);
  setBooleanData(container, "data-doc-llms-chatgpt", options.chatgpt);
  setBooleanData(container, "data-doc-llms-claude", options.claude);

  if (options.link) {
    container.appendChild(createLinkButton(document, labels));
  }

  if (options.copy || options.chatgpt || options.claude) {
    container.appendChild(createOptionsButton(document, labels));
  }

  return container;
}

export function injectLlmsControls(
  body = "",
  page = {},
  siteConfig = {},
  llmsConfig = {},
  languages = {},
) {
  const dom = new JSDOM(`<main>${body}</main>`);
  const document = dom.window.document;
  const h1 = document.querySelector("main > h1");
  if (!h1) return body;

  const container = createLlmsContainer(document, page, siteConfig, llmsConfig, languages);
  if (!container) return body;

  h1.insertAdjacentElement("afterend", container);
  return document.querySelector("main")?.innerHTML || body;
}
