import { isPlainObject } from 'vanilla-jui'

import type { RuntimeConfig, UnknownRecord } from '../types.ts'

export interface TocOptions {
  headings: string
  offset: number
}

export interface LlmsRuntimeOptions {
  enabled: boolean
  link: boolean
  copy: boolean
  chatgpt: boolean
  claude: boolean
}

type FeatureObject = UnknownRecord & {
  enabled?: boolean
  headings?: string
  offset?: unknown
  link?: boolean
  copy?: boolean
  chatgpt?: boolean
  claude?: boolean
}

function featureObject(value: unknown): FeatureObject {
  return isPlainObject(value) ? (value as FeatureObject) : {}
}

export function clientOption(config: RuntimeConfig = {}, key: string): unknown {
  const client = isPlainObject(config.client)
    ? (config.client as UnknownRecord)
    : {}
  if (Object.hasOwn(client, key)) return client[key]
  return undefined
}

export function serverOption(config: RuntimeConfig = {}, key: string): unknown {
  const server = isPlainObject(config.server)
    ? (config.server as UnknownRecord)
    : {}
  if (Object.hasOwn(server, key)) return server[key]
  return undefined
}

export function runtimeOption(
  config: RuntimeConfig = {},
  key: string
): unknown {
  return clientOption(config, key)
}

export function isThemeEnabled(config: RuntimeConfig = {}): boolean {
  const theme = clientOption(config, 'theme')
  if (theme === false) return false
  return featureObject(theme).enabled !== false
}

export function isAuthEnabled(config: RuntimeConfig = {}): boolean {
  const auth = clientOption(config, 'auth')
  return auth === true || featureObject(auth).enabled === true
}

export function isI18nEnabled(_config: RuntimeConfig = {}): boolean {
  return true
}

export function isSearchEnabled(config: RuntimeConfig = {}): boolean {
  return clientOption(config, 'search') !== false
}

export function isExternalLinkEnabled(config: RuntimeConfig = {}): boolean {
  return serverOption(config, 'externalLink') !== false
}

export function isTocEnabled(config: RuntimeConfig = {}): boolean {
  const toc = clientOption(config, 'toc')
  if (toc === false) return false
  return featureObject(toc).enabled !== false
}

export function tocOptions(config: RuntimeConfig = {}): TocOptions {
  const toc = featureObject(clientOption(config, 'toc'))
  const offset = Number(toc.offset)

  return {
    headings:
      typeof toc.headings === 'string' && toc.headings.trim()
        ? toc.headings
        : 'h2, h3',
    offset: Number.isFinite(offset) ? offset : 80,
  }
}

export function isPrevNextEnabled(config: RuntimeConfig = {}): boolean {
  const prevNext = serverOption(config, 'prevNext')
  return prevNext === true || featureObject(prevNext).enabled === true
}

export function isSitemapEnabled(config: RuntimeConfig = {}): boolean {
  return /^https?:\/\//i.test(String(config.siteUrl || '').trim())
}

export function isRobotsEnabled(_config: RuntimeConfig = {}): boolean {
  return true
}

export function isLlmsEnabled(_config: RuntimeConfig = {}): boolean {
  return true
}

export function llmsOptions(config: RuntimeConfig = {}): LlmsRuntimeOptions {
  const llms = featureObject(serverOption(config, 'llms'))
  const enabled = isLlmsEnabled(config)

  return {
    enabled,
    link: enabled && llms.link !== false,
    copy: enabled && llms.copy !== false,
    chatgpt: enabled && llms.chatgpt !== false,
    claude: enabled && llms.claude !== false,
  }
}
