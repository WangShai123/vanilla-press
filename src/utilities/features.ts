import { isPlainObject } from 'vanilla-jui';

import type { DocConfig, UnknownRecord } from '../types.ts';

export interface TocOptions {
  headings: string;
  offset: number;
}

export interface LlmsRuntimeOptions {
  enabled: boolean;
  link: boolean;
  copy: boolean;
  chatgpt: boolean;
  claude: boolean;
}

type FeatureObject = UnknownRecord & {
  enabled?: boolean;
  headings?: string;
  offset?: unknown;
  link?: boolean;
  copy?: boolean;
  chatgpt?: boolean;
  claude?: boolean;
};

function featureObject(value: unknown): FeatureObject {
  return isPlainObject(value) ? (value as FeatureObject) : {};
}

export function runtimeOption(config: DocConfig = {}, key: string): unknown {
  const runtime = isPlainObject(config.runtime)
    ? (config.runtime as UnknownRecord)
    : {};
  return Object.hasOwn(runtime, key) ? runtime[key] : config[key];
}

export function isThemeEnabled(config: DocConfig = {}): boolean {
  const theme = runtimeOption(config, 'theme');
  if (theme === false) return false;
  return featureObject(theme).enabled !== false;
}

export function isAuthEnabled(config: DocConfig = {}): boolean {
  const auth = runtimeOption(config, 'auth');
  return auth === true || featureObject(auth).enabled === true;
}

export function isI18nEnabled(config: DocConfig = {}): boolean {
  const i18n = runtimeOption(config, 'i18n');
  if (i18n === false) return false;
  return featureObject(i18n).enabled !== false;
}

export function isSeoEnabled(config: DocConfig = {}): boolean {
  return runtimeOption(config, 'seo') !== false;
}

export function isSearchEnabled(config: DocConfig = {}): boolean {
  return runtimeOption(config, 'search') !== false;
}

export function isHighlightEnabled(config: DocConfig = {}): boolean {
  const highlight = runtimeOption(config, 'highlight');
  if (highlight === false) return false;
  return featureObject(highlight).enabled !== false;
}

export function isExternalLinkEnabled(config: DocConfig = {}): boolean {
  return runtimeOption(config, 'externalLink') !== false;
}

export function isMenuEnabled(config: DocConfig = {}): boolean {
  return runtimeOption(config, 'menu') !== false;
}

export function isSidebarEnabled(config: DocConfig = {}): boolean {
  return runtimeOption(config, 'sidebar') !== false;
}

export function isTocEnabled(config: DocConfig = {}): boolean {
  const toc = runtimeOption(config, 'toc');
  if (toc === false) return false;
  return featureObject(toc).enabled !== false;
}

export function tocOptions(config: DocConfig = {}): TocOptions {
  const toc = featureObject(runtimeOption(config, 'toc'));
  const offset = Number(toc.offset);

  return {
    headings:
      typeof toc.headings === 'string' && toc.headings.trim()
        ? toc.headings
        : 'h2, h3',
    offset: Number.isFinite(offset) ? offset : 80,
  };
}

export function isPrevNextEnabled(config: DocConfig = {}): boolean {
  const prevNext = runtimeOption(config, 'prevNext');
  return prevNext === true || featureObject(prevNext).enabled === true;
}

export function isSitemapEnabled(config: DocConfig = {}): boolean {
  const sitemap = runtimeOption(config, 'sitemap');
  return sitemap === true || featureObject(sitemap).enabled === true;
}

export function isRobotsEnabled(config: DocConfig = {}): boolean {
  return runtimeOption(config, 'robots') !== false;
}

export function isLlmsEnabled(config: DocConfig = {}): boolean {
  const llms = runtimeOption(config, 'llms');
  if (llms === false) return false;
  return featureObject(llms).enabled !== false;
}

export function isInlineScriptEnabled(): boolean {
  return true;
}

export function llmsOptions(config: DocConfig = {}): LlmsRuntimeOptions {
  const llms = featureObject(runtimeOption(config, 'llms'));
  const enabled = isLlmsEnabled(config);

  return {
    enabled,
    link: enabled && llms.link !== false,
    copy: enabled && llms.copy !== false,
    chatgpt: enabled && llms.chatgpt !== false,
    claude: enabled && llms.claude !== false,
  };
}
