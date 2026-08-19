export function toText(value: unknown, fallback = ''): string {
  if (value == null || value === false) return fallback
  if (typeof value === 'string') return value
  if (
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }
  if (typeof value === 'symbol') return value.description || fallback
  return fallback
}
