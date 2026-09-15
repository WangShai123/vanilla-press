export const compactViewportQuery = '(max-width: 960px)'

interface UserAgentDataLike {
  mobile?: boolean
}

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: UserAgentDataLike
}

export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false

  const value = navigator as NavigatorWithUserAgentData
  const uaDataMobile = value.userAgentData?.mobile
  if (typeof uaDataMobile === 'boolean') return uaDataMobile

  const ua = value.userAgent || ''
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(
      ua
    )
  ) {
    return true
  }

  return (
    (value.platform === 'MacIntel' || /Macintosh/i.test(ua)) &&
    value.maxTouchPoints > 1
  )
}

export function isCompactViewport(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(compactViewportQuery).matches
  )
}
