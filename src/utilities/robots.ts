import type { DocConfig, UnknownRecord } from '../types.ts';
import { isLlmsEnabled } from './features.ts';
import { toText } from './string.ts';

interface RobotsRule extends UnknownRecord {
  userAgent?: unknown;
  userAgents?: unknown;
  allow?: unknown;
  disallow?: unknown;
  crawlDelay?: unknown;
}

interface RobotsConfig extends RobotsRule {
  rules?: unknown;
  sitemap?: unknown;
  llms?: unknown;
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null || value === false) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanValue(value: unknown): string | null {
  if (value === false || value === undefined || value === null) return null;
  const text = toText(value).trim();
  return text || null;
}

function isNonEmptyString(value: string | null): value is string {
  return Boolean(value);
}

function appendFields(lines: string[], field: string, value: unknown): void {
  for (const item of asArray(value)) {
    const text = cleanValue(item);
    if (text) lines.push(`${field}: ${text}`);
  }
}

function asRule(value: unknown): RobotsRule {
  return value && typeof value === 'object' ? (value as RobotsRule) : {};
}

function ruleUserAgents(rule: RobotsRule = {}): string[] {
  const userAgent =
    rule.userAgent ??
    rule.userAgents ??
    rule['user-agent'] ??
    rule['user-agents'] ??
    '*';
  const agents = asArray(userAgent).map(cleanValue).filter(isNonEmptyString);
  return agents.length ? agents : ['*'];
}

function renderRule(rawRule: unknown = {}): string {
  const rule = asRule(rawRule);
  const lines = ruleUserAgents(rule).map((agent) => `User-agent: ${agent}`);

  appendFields(lines, 'Allow', rule.allow);
  appendFields(lines, 'Disallow', rule.disallow);
  appendFields(lines, 'Crawl-delay', rule.crawlDelay ?? rule['crawl-delay']);

  return lines.join('\n');
}

function baseUrl(siteUrl: unknown): string {
  const value = cleanValue(siteUrl);
  return value ? value.replace(/\/+$/g, '') : '';
}

function sitemapUrl(value: unknown, siteUrl: unknown): string | null {
  const base = baseUrl(siteUrl);

  if (value === true) {
    return base ? `${base}/sitemap.xml` : null;
  }

  const text = cleanValue(value);
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text;
  if (!base) return text;

  return `${base}/${text.replace(/^\/+/, '')}`;
}

function llmsUrl(value: unknown, siteUrl: unknown): string | null {
  const base = baseUrl(siteUrl);

  if (value === true) {
    return base ? `${base}/llms.txt` : null;
  }

  const text = cleanValue(value);
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text;
  if (!base) return text;

  return `${base}/${text.replace(/^\/+/, '')}`;
}

function renderSitemaps(config: RobotsConfig = {}, siteUrl: unknown): string {
  return asArray(config.sitemap)
    .map((value) => sitemapUrl(value, siteUrl))
    .filter(Boolean)
    .map((url) => `Sitemap: ${url}`)
    .join('\n');
}

function renderLlms(
  config: RobotsConfig = {},
  siteConfig: DocConfig = {}
): string {
  if (!isLlmsEnabled(siteConfig)) return '';

  return asArray(config.llms)
    .map((value) => llmsUrl(value, siteConfig.siteUrl))
    .filter(Boolean)
    .map((url) => `LLMs: ${url}`)
    .join('\n');
}

export function renderRobotsTxt(
  config: RobotsConfig = {},
  siteConfig: DocConfig = {}
): string {
  const rules = Array.isArray(config.rules) ? config.rules : [config];
  const blocks = rules.map(renderRule).filter(Boolean);
  const sitemaps = renderSitemaps(config, siteConfig.siteUrl);
  const llms = renderLlms(config, siteConfig);

  if (sitemaps) blocks.push(sitemaps);
  if (llms) blocks.push(llms);

  return `${blocks.join('\n\n').trim()}\n`;
}
