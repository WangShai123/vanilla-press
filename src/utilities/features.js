import { hasOwn, isPlainObject } from "vanilla-jui";

export function runtimeOption(config = {}, key) {
  const runtime = isPlainObject(config.runtime) ? config.runtime : {};
  return hasOwn(runtime, key) ? runtime[key] : config[key];
}

export function componentOption(config = {}, key) {
  const components = isPlainObject(config.components) ? config.components : {};
  return hasOwn(components, key) ? components[key] : config[key];
}

export function isThemeEnabled(config = {}) {
  const theme = runtimeOption(config, "theme");
  if (theme === false) return false;
  return theme?.enabled !== false;
}

export function isI18nEnabled(config = {}) {
  const i18n = runtimeOption(config, "i18n");
  if (i18n === false) return false;
  return i18n?.enabled !== false;
}

export function isSeoEnabled(config = {}) {
  return runtimeOption(config, "seo") !== false;
}

export function isSearchEnabled(config = {}) {
  return runtimeOption(config, "search") !== false;
}

export function isHighlightEnabled(config = {}) {
  return runtimeOption(config, "highlight") !== false;
}

export function isMenuEnabled(config = {}) {
  return runtimeOption(config, "menu") !== false;
}

export function isSidebarEnabled(config = {}) {
  return runtimeOption(config, "sidebar") !== false;
}

export function isTocEnabled(config = {}) {
  const toc = runtimeOption(config, "toc");
  if (toc === false) return false;
  return toc?.enabled !== false;
}

export function tocOptions(config = {}) {
  const toc = runtimeOption(config, "toc");
  return {
    headings: typeof toc?.headings === "string" && toc.headings.trim() ? toc.headings : "h2, h3",
  };
}

export function isPrevNextEnabled(config = {}) {
  const prevNext = runtimeOption(config, "prevNext");
  return prevNext === true || prevNext?.enabled === true;
}

export function isSitemapEnabled(config = {}) {
  const sitemap = runtimeOption(config, "sitemap");
  return sitemap === true || sitemap?.enabled === true;
}

export function isTreeEnabled(config = {}) {
  const tree = componentOption(config, "tree");
  return tree === true || tree?.enabled === true;
}

export function treeOptions(config = {}) {
  const tree = componentOption(config, "tree");
  return {
    fileIcon: tree?.fileIcon !== false,
  };
}
