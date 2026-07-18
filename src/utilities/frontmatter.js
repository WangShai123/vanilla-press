export function readFrontmatter(markdown = "") {
  const match = String(markdown).match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  return match?.[1] || "";
}

function cleanFrontmatterValue(value = "") {
  const raw = String(value).trim();
  const quote = raw[0];
  if ((quote === '"' || quote === "'") && raw.at(-1) === quote) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

export function parseFrontmatter(markdown = "") {
  const frontmatter = readFrontmatter(markdown);
  const data = {};
  if (!frontmatter) return data;

  for (const line of frontmatter.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (!match) continue;

    const key = match[1].trim();
    const value = cleanFrontmatterValue(match[2]);
    if (value) data[key] = value;
  }

  return data;
}

export function pickSeoFrontmatter(frontmatter = {}) {
  const seo = {};
  for (const key of ["title", "keywords", "description"]) {
    const value = String(frontmatter[key] || "").trim();
    if (value) seo[key] = value;
  }
  return seo;
}
