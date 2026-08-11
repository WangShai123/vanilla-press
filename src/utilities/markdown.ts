import type { Renderer, RendererRule, StateBlock, Token } from 'markdown-it';

import type { UnknownRecord } from '../types.ts';
import { toText } from './string.ts';

export interface MarkdownEnv extends UnknownRecord {
  components?: Set<string>;
  inlineScripts?: string[];
}

export type MarkdownBlockState = StateBlock;
export type MarkdownToken = Token;

export interface ContainerContent {
  content: string;
  nextLine: number;
}

export interface MarkedBlock {
  title: string;
  content: string;
}

interface PendingBlock {
  title: string;
  lines: string[];
}

export type MarkdownBlockRule = (
  state: MarkdownBlockState,
  startLine: number,
  endLine: number,
  silent: boolean
) => boolean;

export type MarkdownRendererRule = RendererRule;

export interface MarkdownRuntime {
  block: {
    ruler: {
      before(
        anchorName: string,
        ruleName: string,
        rule: MarkdownBlockRule
      ): void;
    };
  };
  renderer: {
    rules: Renderer['rules'];
  };
  render(content: string, env?: MarkdownEnv): string;
}

export function markComponent(
  env: MarkdownEnv | undefined,
  name: string
): void {
  if (!env) return;
  if (!env.components) env.components = new Set();
  env.components.add(name);
}

export function readContainer(
  state: MarkdownBlockState,
  startLine: number,
  endLine: number,
  marker = ':::'
): ContainerContent {
  let nextLine = startLine + 1;
  const lines: string[] = [];
  let fence: string | null = null;
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

function isContainerOpen(trimmed: string, marker: string): boolean {
  return trimmed.startsWith(marker) && trimmed.length > marker.length;
}

function updateFenceState(
  trimmed: string,
  fence: string | null
): string | null {
  const match = trimmed.match(/^(`{3,}|~{3,})/);
  if (!match) return fence;

  const marker = match[1];
  if (!fence) return marker;

  return marker[0] === fence[0] && marker.length >= fence.length ? null : fence;
}

export function escapeAttr(value: unknown): string {
  return toText(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function slugify(value: unknown): string {
  return toText(value)
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseBracketTitle(info: unknown): string {
  const text = toText(info);
  const match = text.match(/\[(.*)]/);
  return match ? match[1].trim() : text.trim();
}

export function parseFlag(info: unknown, name: string): boolean {
  return new RegExp(`(?:^|\\s)${name}(?:\\s|$)`).test(toText(info));
}

export function splitMarkedBlocks(
  content: string,
  marker: RegExp,
  fallbackTitle = '内容'
): MarkedBlock[] {
  const blocks: PendingBlock[] = [];
  let current: PendingBlock | null = null;
  let fence: string | null = null;

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

export function splitByHeadings(
  content: string,
  titles: string[]
): MarkedBlock[] {
  if (!titles.length) return [];

  const lines = content.split('\n');
  const blocks: PendingBlock[] = [];
  let current: PendingBlock | null = null;
  let fence: string | null = null;

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
