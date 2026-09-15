import { createOffcanvas, createToc, icon, q } from 'vanilla-jui'

import type { RuntimeConfig, DocI18n } from '../types.ts'
import { isTocEnabled, tocOptions } from '../utilities/features.ts'
import { localize } from './i18n.ts'
import { compactViewportQuery, isCompactViewport } from './viewport.ts'

interface DrawerApi {
  show(): unknown
  hide(): unknown
}

function translate(key: string, fallback: string, i18n: DocI18n): string {
  const text = localize(key, i18n)
  return text && text !== key ? text : fallback
}

function bindNav(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.vp-nav').forEach((nav) => {
    if (nav.dataset.vpReady === 'true') return

    nav
      .querySelectorAll<HTMLElement>('.vp-nav-item.has-children')
      .forEach((item) => {
        const toggle = item.querySelector<HTMLButtonElement>(
          ':scope > .vp-nav-toggle'
        )
        const title = item.querySelector<HTMLAnchorElement>(
          ':scope > .vp-nav-title'
        )
        const list = item.querySelector<HTMLElement>(
          ':scope > .vp-nav-children'
        )
        if (!toggle || !list) return

        const setCollapsed = (collapsed: boolean): void => {
          item.classList.toggle('is-collapsed', collapsed)
          list.hidden = collapsed
          toggle.setAttribute('aria-expanded', String(!collapsed))
        }

        toggle.addEventListener('click', () => {
          setCollapsed(!item.classList.contains('is-collapsed'))
        })

        if (title && !title.hasAttribute('href')) {
          title.addEventListener('click', () => toggle.click())
        }
      })

    nav.dataset.vpReady = 'true'
  })
}

function clonedContent(selector: string): HTMLElement | null {
  const source = q<HTMLElement>(selector)
  const content = source?.firstElementChild?.cloneNode(true)
  if (content instanceof HTMLElement) {
    content.querySelectorAll<HTMLElement>('[data-vp-ready]').forEach((node) => {
      node.removeAttribute('data-vp-ready')
    })
    content.removeAttribute('data-vp-ready')
  }
  return content instanceof HTMLElement ? content : null
}

function closeOnAnchorClick(root: HTMLElement, close: () => void): void {
  root.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return
    const link = event.target.closest('a[href]')
    if (link) close()
  })
}

function onCompactViewportExit(close: () => void): void {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return
  }

  const media = window.matchMedia(compactViewportQuery)
  const listener = (event: MediaQueryListEvent): void => {
    if (!event.matches) close()
  }

  media.addEventListener('change', listener)
}

export function initHeaderMenu(): void {
  const nav = q<HTMLElement>('.vp-menu[data-vp-menu]')
  if (!nav) return
  nav.classList.add('j-menu')
  nav.dataset.vpReady = 'true'
}

export function initMobileHeader(): void {
  const menuButton = q<HTMLButtonElement>('[data-vp-mobile-menu]')
  if (!menuButton || menuButton.dataset.vpReady === 'true') return

  menuButton.textContent = ''
  menuButton.append(icon('menu', { className: 'el-icon' }))

  if (!q<HTMLElement>('[data-vp-mobile-menu-content]')) {
    menuButton.hidden = true
    menuButton.dataset.vpReady = 'true'
    return
  }

  let drawer: DrawerApi | null = null
  const showMenu = (): void => {
    if (!isCompactViewport()) return

    if (!drawer) {
      const panel = clonedContent('[data-vp-mobile-menu-content]')
      if (!panel) return

      bindNav(panel)
      drawer = createOffcanvas({
        direction: 'left',
        content: panel,
      }).build()

      closeOnAnchorClick(panel, () => {
        void drawer?.hide()
      })
      onCompactViewportExit(() => {
        void drawer?.hide()
      })
    }

    drawer.show()
  }

  menuButton.addEventListener('click', showMenu)
  menuButton.dataset.vpReady = 'true'
}

export function initSidebar(): void {
  const sidebar = q<HTMLElement>('.vp-sidebar')
  if (sidebar) bindNav(sidebar)
}

export function initMobileSecondary(
  i18n: DocI18n,
  config: RuntimeConfig = {}
): void {
  const sidebarButton = q<HTMLButtonElement>('[data-vp-mobile-sidebar]')
  const tocButton = q<HTMLButtonElement>('[data-vp-mobile-toc]')
  const sidebarLabel = translate('mobile.navigation', '导航', i18n)
  const tocLabel = translate('mobile.toc', '目录', i18n)

  if (sidebarButton && sidebarButton.dataset.vpReady !== 'true') {
    sidebarButton.textContent = ''
    sidebarButton.setAttribute('aria-label', sidebarLabel)
    sidebarButton.append(icon('align-left', { className: 'el-icon el-prefix' }))
    sidebarButton.append(sidebarLabel)

    if (!q<HTMLElement>('[data-vp-mobile-sidebar-content]')) {
      sidebarButton.hidden = true
    } else {
      let sidebarDrawer: DrawerApi | null = null
      const showSidebar = (): void => {
        if (!isCompactViewport()) return

        if (!sidebarDrawer) {
          const panel = clonedContent('[data-vp-mobile-sidebar-content]')
          if (!panel) return

          bindNav(panel)
          sidebarDrawer = createOffcanvas({
            direction: 'left',
            content: panel,
          }).build()

          closeOnAnchorClick(panel, () => {
            void sidebarDrawer?.hide()
          })
          onCompactViewportExit(() => {
            void sidebarDrawer?.hide()
          })
        }

        sidebarDrawer.show()
      }

      sidebarButton.addEventListener('click', showSidebar)
    }
    sidebarButton.dataset.vpReady = 'true'
  }

  if (
    tocButton &&
    tocButton.dataset.vpReady !== 'true' &&
    isTocEnabled(config)
  ) {
    tocButton.textContent = ''
    tocButton.setAttribute('aria-label', tocLabel)
    tocButton.append(tocLabel)
    tocButton.append(icon('align-right', { className: 'el-icon el-suffix' }))

    const article = q<HTMLElement>('.j-editor')
    const { headings, offset } = tocOptions(config)
    if (!article || !q(headings, article)) {
      tocButton.hidden = true
      tocButton.dataset.vpReady = 'true'
      return
    }

    let tocDrawer: DrawerApi | null = null
    const showToc = (): void => {
      if (!isCompactViewport()) return

      if (!tocDrawer) {
        const tocPanel = document.createElement('div')
        tocPanel.className = 'vp-mobile-toc-panel'
        const toc = createToc({
          target: article,
          headings,
          offset,
        })
        toc.mount(tocPanel)
        tocDrawer = createOffcanvas({
          direction: 'right',
          content: tocPanel,
        }).build()

        closeOnAnchorClick(tocPanel, () => {
          void tocDrawer?.hide()
        })
        onCompactViewportExit(() => {
          void tocDrawer?.hide()
        })
      }

      tocDrawer.show()
    }

    tocButton.addEventListener('click', showToc)
    tocButton.dataset.vpReady = 'true'
  }
}
