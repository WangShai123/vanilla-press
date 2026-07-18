export function isThemeEnabled(config = {}) {
  if (config.theme === false) return false;
  return config.theme?.enabled !== false;
}

export function isI18nEnabled(config = {}) {
  return config.i18n?.enabled !== false;
}

export function isSeoEnabled(config = {}) {
  return config.seo !== false;
}

export function isSearchEnabled(config = {}) {
  return config.search !== false;
}

export function isHighlightEnabled(config = {}) {
  return config.highlight !== false;
}

export function isMenuEnabled(config = {}) {
  return config.menu !== false;
}

export function isSidebarEnabled(config = {}) {
  return config.sidebar !== false;
}

export function isTocEnabled(config = {}) {
  if (config.toc === false) return false;
  return config.toc?.enabled !== false;
}

export function tocOptions(config = {}) {
  const toc = config.toc;
  return {
    headings: typeof toc?.headings === "string" && toc.headings.trim() ? toc.headings : "h2, h3",
  };
}

export function isPrevNextEnabled(config = {}) {
  return config.prevNext === true || config.prevNext?.enabled === true;
}

export function isSitemapEnabled(config = {}) {
  return config.sitemap === true || config.sitemap?.enabled === true;
}

export function isTreeEnabled(config = {}) {
  return config.tree === true || config.tree?.enabled === true;
}

export function treeOptions(config = {}) {
  return {
    fileIcon: config.tree?.fileIcon !== false,
  };
}
