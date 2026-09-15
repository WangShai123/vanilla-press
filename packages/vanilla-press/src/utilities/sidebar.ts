import type { NavItem, RuntimePage, RuntimeSidebar } from '../types.ts'

function normalizeSidebarRel(value: unknown = ''): string {
  return String(value)
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/')
}

function pageIsInsideDir(page: RuntimePage = {}, dir: unknown): boolean {
  const rel = normalizeSidebarRel(page.rel || 'index.html')
  const base = normalizeSidebarRel(dir)
  return Boolean(base) && rel.startsWith(`${base}/`)
}

export function resolvePageSidebarItems(
  sidebar: RuntimeSidebar | undefined,
  page: RuntimePage = {}
): NavItem[] {
  if (Array.isArray(sidebar)) return sidebar

  const globalItems = Array.isArray(sidebar?.items) ? sidebar.items : []
  const directories = Array.isArray(sidebar?.directories)
    ? sidebar.directories
    : []
  let selected: NavItem[] | null = null
  let selectedLength = -1

  for (const entry of directories) {
    if (!Array.isArray(entry.items) || !pageIsInsideDir(page, entry.dir)) {
      continue
    }

    const length = normalizeSidebarRel(entry.dir).length
    if (length > selectedLength) {
      selected = entry.items
      selectedLength = length
    }
  }

  return selected || globalItems
}
