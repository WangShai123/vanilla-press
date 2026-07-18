import path from "path";

export function pageTitle(markdown, file) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || path.basename(file, ".md");
}

export function normalizeSiteName(config = {}) {
  return String(config.siteName || "Docs").trim() || "Docs";
}

export function documentTitle(title, config = {}) {
  const pageTitleValue = String(title || "").trim();
  const siteName = normalizeSiteName(config);
  return pageTitleValue ? `${pageTitleValue} - ${siteName}` : siteName;
}

export function excerptText(text = "", maxLength = 180) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}
