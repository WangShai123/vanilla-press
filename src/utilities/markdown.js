export function markComponent(env, name) {
  if (!env.components) env.components = new Set();
  env.components.add(name);
}

export function readContainer(state, startLine, endLine, marker = ':::') {
  let nextLine = startLine + 1;
  const lines = [];
  let fence = null;
  let depth = 0;

  while (nextLine < endLine) {
    const start = state.bMarks[nextLine];
    const end = state.eMarks[nextLine];
    const text = state.src.slice(start, end);
    const trimmed = text.trim();

    if (!fence && trimmed === marker) {
      if (depth === 0) {
        return {
          content: lines.join('\n'),
          nextLine: nextLine + 1,
        };
      }

      depth -= 1;
      lines.push(text);
      nextLine += 1;
      continue;
    }

    if (!fence && isContainerOpen(trimmed, marker)) {
      depth += 1;
    }

    fence = updateFenceState(trimmed, fence);
    lines.push(text);
    nextLine += 1;
  }

  return {
    content: lines.join('\n'),
    nextLine,
  };
}

function isContainerOpen(trimmed, marker) {
  return trimmed.startsWith(marker) && trimmed.length > marker.length;
}

function updateFenceState(trimmed, fence) {
  const match = trimmed.match(/^(`{3,}|~{3,})/);
  if (!match) return fence;

  const marker = match[1];
  if (!fence) return marker;

  return marker[0] === fence[0] && marker.length >= fence.length ? null : fence;
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
  let fence = null;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    const match = !fence ? line.match(marker) : null;
    if (!fence && match) {
      if (current) blocks.push(current);
      current = { title: match[1].trim(), lines: [] };
      continue;
    }

    if (!current) current = { title: fallbackTitle, lines: [] };
    fence = updateFenceState(trimmed, fence);
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
  let fence = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = !fence ? line.match(/^(#{1,6})\s+(.+?)\s*$/) : null;
    const title = match?.[2]?.trim();

    if (!fence && title && titles.includes(title)) {
      if (current) blocks.push(current);
      current = { title, lines: [] };
      continue;
    }

    fence = updateFenceState(trimmed, fence);
    if (current) current.lines.push(line);
  }

  if (current) blocks.push(current);
  if (blocks.length !== titles.length) return [];

  return blocks.map((block) => ({
    title: block.title,
    content: block.lines.join('\n').trim(),
  }));
}
