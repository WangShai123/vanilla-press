import path from 'path';

import { toText } from './string.ts';

export function resolveDir(
  projectRoot: string,
  value: string | undefined,
  fallback: string
): string {
  return path.resolve(projectRoot, value || fallback);
}

export function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}

export function stripMdExt(file: string): string {
  return file.replace(/\.md$/i, '.html');
}

export function normalizePath(value: unknown): string {
  return toText(value).replace(/^\/+/, '').replace(/\/+$/g, '');
}

export function relativeAsset(fromRel: string, assetRel: string): string {
  const relative = path.posix.relative(path.posix.dirname(fromRel), assetRel);
  return relative.startsWith('.') ? relative : `./${relative}`;
}
