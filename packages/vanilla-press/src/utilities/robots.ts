import type { UnknownRecord } from '../types.ts'
import { toText } from './string.ts'

interface RobotsRule extends UnknownRecord {
  userAgent?: unknown
  userAgents?: unknown
  allow?: unknown
  disallow?: unknown
  crawlDelay?: unknown
}

interface RobotsConfig extends RobotsRule {
  rules?: unknown
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null || value === false) return []
  return Array.isArray(value) ? value : [value]
}

function cleanValue(value: unknown): string | null {
  if (value === false || value === undefined || value === null) return null
  const text = toText(value).trim()
  return text || null
}

function isNonEmptyString(value: string | null): value is string {
  return Boolean(value)
}

function appendFields(lines: string[], field: string, value: unknown): void {
  for (const item of asArray(value)) {
    const text = cleanValue(item)
    if (text) lines.push(`${field}: ${text}`)
  }
}

function asRule(value: unknown): RobotsRule {
  return value && typeof value === 'object' ? (value as RobotsRule) : {}
}

function ruleUserAgents(rule: RobotsRule = {}): string[] {
  const userAgent =
    rule.userAgent ??
    rule.userAgents ??
    rule['user-agent'] ??
    rule['user-agents'] ??
    '*'
  const agents = asArray(userAgent).map(cleanValue).filter(isNonEmptyString)
  return agents.length ? agents : ['*']
}

function renderRule(rawRule: unknown = {}): string {
  const rule = asRule(rawRule)
  const lines = ruleUserAgents(rule).map((agent) => `User-agent: ${agent}`)

  appendFields(lines, 'Allow', rule.allow)
  appendFields(lines, 'Disallow', rule.disallow)
  appendFields(lines, 'Crawl-delay', rule.crawlDelay ?? rule['crawl-delay'])

  return lines.join('\n')
}

export function renderRobotsTxt(config: RobotsConfig = {}): string {
  const rules = Array.isArray(config.rules) ? config.rules : [config]
  const blocks = rules.map(renderRule).filter(Boolean)

  return `${blocks.join('\n\n').trim()}\n`
}
