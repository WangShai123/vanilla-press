export function pageTitle(markdown, file) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;
  const value = String(file || "");
  const name = value.split(/[/\\]/).pop() || "";
  return name.replace(/\.md$/i, "");
}

export function normalizeSiteName(config = {}) {
  return String(config.siteName || "VanillaPress").trim() || "VanillaPress";
}

export function documentTitle(title, config = {}) {
  const pageTitleValue = String(title || "").trim();
  const siteName = normalizeSiteName(config);
  return pageTitleValue ? `${pageTitleValue} - ${siteName}` : siteName;
}

export function excerptText(text = "", maxLength = 180) {
  const value = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}
