export const compactViewportQuery = '(max-width: 960px)'

export function isCompactViewport(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(compactViewportQuery).matches
  )
}
