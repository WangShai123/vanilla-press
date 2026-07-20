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

function parseScalar(value = "") {
  const raw = cleanFrontmatterValue(value);
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw === "null") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

function parseLine(line = "") {
  const indent = line.match(/^\s*/)?.[0].length || 0;
  return {
    indent,
    content: line.trim(),
  };
}

function parseKeyValue(content = "") {
  const match = content.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
  if (!match) return null;

  return {
    key: match[1].trim(),
    value: match[2],
    hasValue: match[2].trim() !== "",
  };
}

function mergeObject(target, source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return target;
  return Object.assign(target, source);
}

function parseBlock(lines, index, indent, root) {
  const first = lines[index];
  const isArray = first?.indent === indent && first.content.startsWith("- ");
  return isArray
    ? parseArrayBlock(lines, index, indent, root)
    : parseObjectBlock(lines, index, indent, root);
}

function parseArrayBlock(lines, index, indent, root) {
  const items = [];
  let current = index;

  while (current < lines.length) {
    const line = lines[current];
    if (line.indent < indent) break;
    if (line.indent !== indent || !line.content.startsWith("- ")) break;

    const content = line.content.slice(2).trim();
    if (!content) {
      const [nested, next] = parseBlock(lines, current + 1, lines[current + 1]?.indent ?? indent + 2, root);
      items.push(nested);
      current = next;
      continue;
    }

    const pair = parseKeyValue(content);
    if (!pair) {
      items.push(parseScalar(content));
      current += 1;
      continue;
    }

    const item = {};
    if (pair.hasValue) {
      item[pair.key] = parseScalar(pair.value);
      current += 1;
    } else if (lines[current + 1]?.indent > indent) {
      const [nested, next] = parseBlock(lines, current + 1, lines[current + 1].indent, root);
      item[pair.key] = nested;
      current = next;
    } else {
      item[pair.key] = {};
      current += 1;
    }

    if (lines[current]?.indent > indent) {
      const [nested, next] = parseObjectBlock(lines, current, lines[current].indent, root);
      mergeObject(item, nested);
      current = next;
    }

    items.push(item);
  }

  return [items, current];
}

function parseObjectBlock(lines, index, indent, root, target) {
  const data = target || {};
  let current = index;

  while (current < lines.length) {
    const line = lines[current];
    if (line.indent < indent) break;
    if (line.indent !== indent || line.content.startsWith("- ")) break;

    const pair = parseKeyValue(line.content);
    if (!pair) {
      current += 1;
      continue;
    }

    if (pair.hasValue) {
      data[pair.key] = parseScalar(pair.value);
      current += 1;
      continue;
    }

    const nextIndent = lines[current + 1]?.indent;
    const [nested, next] =
      nextIndent > indent ? parseBlock(lines, current + 1, nextIndent, root) : [{}, current + 1];

    if (data === root && pair.key === "layout" && typeof data.layout === "string") {
      const name = data.layout.trim();
      data.layouts = data.layouts && typeof data.layouts === "object" ? data.layouts : {};
      data.layouts[name] = nested;
    } else {
      data[pair.key] = nested;
    }

    current = next;
  }

  return [data, current];
}

export function parseFrontmatter(markdown = "") {
  const frontmatter = readFrontmatter(markdown);
  const data = {};
  if (!frontmatter) return data;

  const lines = frontmatter
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map(parseLine);
  parseObjectBlock(lines, 0, lines[0]?.indent || 0, data, data);

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
