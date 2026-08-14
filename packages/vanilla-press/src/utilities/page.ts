import type { DocConfig } from '../types.ts';
import { toText } from './string.ts';

export function pageTitle(markdown: string, file: string): string {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;
  const value = String(file || '');
  const name = value.split(/[/\\]/).pop() || '';
  return name.replace(/\.md$/i, '');
}

export function normalizeSiteName(config: DocConfig = {}): string {
  return toText(config.siteName, 'VanillaPress').trim() || 'VanillaPress';
}

export function documentTitle(title: unknown, config: DocConfig = {}): string {
  const pageTitleValue = toText(title).trim();
  const siteName = normalizeSiteName(config);
  return pageTitleValue ? `${pageTitleValue} - ${siteName}` : siteName;
}

export function excerptText(text = '', maxLength = 180): string {
  const value = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}
