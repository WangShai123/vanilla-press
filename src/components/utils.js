export function markComponent(env, name) {
  if (!env.components) env.components = new Set();
  env.components.add(name);
}

export function readContainer(state, startLine, endLine, marker = ':::') {
  let nextLine = startLine + 1;
  const lines = [];

  while (nextLine < endLine) {
    const start = state.bMarks[nextLine] + state.tShift[nextLine];
    const end = state.eMarks[nextLine];
    const text = state.src.slice(start, end);

    if (text.trim() === marker) {
      return {
        content: lines.join('\n'),
        nextLine: nextLine + 1,
      };
    }

    lines.push(text);
    nextLine += 1;
  }

  return {
    content: lines.join('\n'),
    nextLine,
  };
}

export function escapeAttr(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseBracketTitle(info) {
  const match = String(info || '').match(/\[(.*)]/);
  return match ? match[1].trim() : String(info || '').trim();
}

export function parseFlag(info, name) {
  return new RegExp(`(?:^|\\s)${name}(?:\\s|$)`).test(String(info || ''));
}

export function splitMarkedBlocks(content, marker, fallbackTitle = '内容') {
  const blocks = [];
  let current = null;

  for (const line of content.split('\n')) {
    const match = line.match(marker);
    if (match) {
      if (current) blocks.push(current);
      current = { title: match[1].trim(), lines: [] };
      continue;
    }

    if (!current) current = { title: fallbackTitle, lines: [] };
    current.lines.push(line);
  }

  if (current) blocks.push(current);
  return blocks.map((block) => ({
    title: block.title || fallbackTitle,
    content: block.lines.join('\n').trim(),
  }));
}

export function splitByHeadings(content, titles) {
  if (!titles.length) return [];

  const lines = content.split('\n');
  const blocks = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    const title = match?.[2]?.trim();

    if (title && titles.includes(title)) {
      if (current) blocks.push(current);
      current = { title, lines: [] };
      continue;
    }

    if (current) current.lines.push(line);
  }

  if (current) blocks.push(current);
  if (blocks.length !== titles.length) return [];

  return blocks.map((block) => ({
    title: block.title,
    content: block.lines.join('\n').trim(),
  }));
}
