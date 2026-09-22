import type { RuntimeConfig } from '../../types.ts'
import { editorClassName } from '../../utilities/editor-size.ts'
import { renderFooterInfo, renderSocialList } from './chrome.ts'

interface ShellOptions {
  body: string
  config: RuntimeConfig
  sidebarEnabled: boolean
  tocEnabled: boolean
  sidebar?: string
  mobileSidebar?: string
}

interface AsideOptions {
  config: RuntimeConfig
  toc: string
}

interface ShellContextOptions {
  config: RuntimeConfig
  sidebarEnabled: boolean
  tocEnabled: boolean
  header?: string
  headerDocNav?: string
  sidebar?: string
  mobileSidebar?: string
  prevNext?: string
}

function renderSidebar(sidebarEnabled: boolean, sidebar = ''): string {
  return sidebarEnabled && sidebar
    ? `    <aside class="vp-sidebar">
      ${sidebar}
    </aside>`
    : ''
}

function renderToc(tocEnabled: boolean): string {
  return tocEnabled
    ? '        <div class="vp-toc" data-vp-toc aria-label="页面目录"></div>'
    : ''
}

function renderAside({ config, toc }: AsideOptions): string {
  return toc || config.aside?.html
    ? `      <aside class="vp-aside" data-reveal="2">
${toc}
        <div class="vp-aside-custom" data-vp-aside-custom></div>
      </aside>`
    : ''
}

export function renderPageShell({
  body,
  config,
  sidebarEnabled,
  tocEnabled,
  sidebar = '',
  mobileSidebar = '',
}: ShellOptions): string {
  const sidebarHtml = renderSidebar(sidebarEnabled, sidebar)
  const toc = renderToc(tocEnabled)
  const aside = renderAside({ config, toc })
  const hasAside = Boolean(aside)
  const editorClass = editorClassName(config)
  const footerInfo = renderFooterInfo(config)
  const socialList = renderSocialList(config)

  return `${mobileSidebar}
  <main class="vp-shell${sidebarEnabled ? ' has-sidebar' : ''}">
${sidebarHtml}
    <section class="vp-main${hasAside ? ' has-aside' : ''}">
      <div class="vp-content" data-reveal>
        <div class="vp-content-wrap">
          <article class="${editorClass}" data-vp-editor>
            ${body}
          </article>
        </div>
        <div data-vp-prev-next></div>
      </div>
${aside}
    </section>
  </main>
  <footer class="vp-footer" data-vp-footer>${footerInfo}${socialList}</footer>`
}

export function createPageShellContext({
  config,
  sidebarEnabled,
  tocEnabled,
  header = '',
  headerDocNav = '',
  sidebar = '',
  mobileSidebar = '',
  prevNext = '',
}: ShellContextOptions) {
  const sidebarHtml = renderSidebar(sidebarEnabled, sidebar)
  const toc = renderToc(tocEnabled)
  const aside = renderAside({ config, toc })
  const hasAside = Boolean(aside)
  const editorClass = editorClassName(config)
  const footerInfo = renderFooterInfo(config)
  const socialList = renderSocialList(config)

  return {
    shell: {
      className: `vp-shell${sidebarEnabled ? ' has-sidebar' : ''}`,
      mainClassName: `vp-main${hasAside ? ' has-aside' : ''}`,
      editorClassName: editorClass,
    },
    slots: {
      header,
      headerDocNav,
      sidebar: sidebarHtml,
      mobileSidebar,
      toc,
      aside,
      prevNext: prevNext || '<div data-vp-prev-next></div>',
      'footer-info': footerInfo,
      'social-list': socialList,
    },
  }
}
