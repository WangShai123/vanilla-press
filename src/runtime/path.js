export function normalizeRel(value = '') {
  return String(value).replace(/^\/+/, '').replace(/\/+/g, '/');
}

export function localeCode(value = '') {
  return String(value).trim().toLowerCase();
}

function dirname(rel) {
  const normalized = normalizeRel(rel);
  const index = normalized.lastIndexOf('/');
  return index >= 0 ? normalized.slice(0, index) : '';
}

export function relativeAsset(fromRel, toRel) {
  const fromParts = dirname(fromRel).split('/').filter(Boolean);
  const toParts = normalizeRel(toRel).split('/').filter(Boolean);

  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }

  const relative = [...fromParts.map(() => '..'), ...toParts].join('/');
  return relative ? (relative.startsWith('.') ? relative : `./${relative}`) : './';
}

