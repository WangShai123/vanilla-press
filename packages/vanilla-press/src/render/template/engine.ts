import { isRecord, type UnknownRecord } from '../../types.ts'
import { escapeHtml } from '../../utilities/html.ts'
import { toText } from '../../utilities/string.ts'

type TemplateValue = unknown
type TemplateContext = UnknownRecord & { this?: TemplateValue }

function lookupPath(context: TemplateContext, path = ''): TemplateValue {
  const key = String(path || '').trim()
  if (!key) return ''
  if (key === '.' || key === 'this') return context?.this ?? ''

  const parts = key.split('.')
  let value: TemplateValue = context

  for (const part of parts) {
    if (value == null) return ''
    if (!isRecord(value)) return ''
    value = value[part]
  }

  return value ?? ''
}

function childContext(
  parent: TemplateContext,
  value: TemplateValue
): TemplateContext {
  if (isRecord(value)) {
    return {
      ...parent,
      ...value,
      this: value,
    }
  }

  return {
    ...parent,
    this: value,
  }
}

function renderValue(value: TemplateValue, raw = false): string {
  if (value == null || value === false) return ''
  if (Array.isArray(value) || typeof value === 'object') return ''
  return raw ? toText(value) : escapeHtml(value)
}

function renderSections(template: string, context: TemplateContext): string {
  return template.replace(
    /{{#\s*([A-Za-z_$][\w$.-]*)\s*}}([\s\S]*?){{\/\s*\1\s*}}/g,
    (_match: string, key: string, content: string) => {
      const value = lookupPath(context, key)

      if (Array.isArray(value)) {
        return value
          .map((item) => renderTemplate(content, childContext(context, item)))
          .join('')
      }

      if (value && typeof value === 'object') {
        return renderTemplate(content, childContext(context, value))
      }

      return value ? renderTemplate(content, context) : ''
    }
  )
}

export function renderTemplate(
  template = '',
  context: TemplateContext = {}
): string {
  const withSections = renderSections(String(template), context)
  const rawValues: string[] = []
  const withRawPlaceholders = withSections.replace(
    /{{{\s*([A-Za-z_$][\w$.-]*)\s*}}}/g,
    (_match: string, key: string) => {
      const index =
        rawValues.push(renderValue(lookupPath(context, key), true)) - 1
      return `___DOC_TEMPLATE_RAW_${index}___`
    }
  )

  return withRawPlaceholders
    .replace(/{{\s*([A-Za-z_$][\w$.-]*)\s*}}/g, (_match: string, key: string) =>
      renderValue(lookupPath(context, key))
    )
    .replace(
      /___DOC_TEMPLATE_RAW_(\d+)___/g,
      (_match: string, index: string) => rawValues[Number(index)] || ''
    )
}
