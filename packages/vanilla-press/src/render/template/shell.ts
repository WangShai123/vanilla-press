import type { RuntimeConfig } from '../../types.ts'

interface ShellOptions {
  body: string
  config: RuntimeConfig
  sidebarEnabled: boolean
  tocEnabled: boolean
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
  secondary?: string
}

function renderSidebar(sidebarEnabled: boolean): string {
  return sidebarEnabled
    ? `    <aside class="vp-sidebar">
      <nav class="vp-nav" data-vp-sidebar aria-label="文档导航"></nav>
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
}: ShellOptions): string {
  const sidebar = renderSidebar(sidebarEnabled)
  const toc = renderToc(tocEnabled)
  const aside = renderAside({ config, toc })
  const hasAside = Boolean(aside)

  return `<main class="vp-shell${sidebarEnabled ? ' has-sidebar' : ''}">
${sidebar}
    <section class="vp-main${hasAside ? ' has-aside' : ''}">
      <div class="vp-content" data-reveal>
        <div class="vp-content-wrap">
          <article class="j-content is-sm" data-vp-editor>
            ${body}
          </article>
        </div>
        <div data-vp-prev-next></div>
      </div>
${aside}
    </section>
  </main>
  <footer class="vp-footer" data-vp-footer></footer>`
}

export function createPageShellContext({
  config,
  sidebarEnabled,
  tocEnabled,
  header = '',
  secondary = '',
}: ShellContextOptions) {
  const sidebar = renderSidebar(sidebarEnabled)
  const toc = renderToc(tocEnabled)
  const aside = renderAside({ config, toc })
  const hasAside = Boolean(aside)

  return {
    shell: {
      className: `vp-shell${sidebarEnabled ? ' has-sidebar' : ''}`,
      mainClassName: `vp-main${hasAside ? ' has-aside' : ''}`,
    },
    slots: {
      header,
      secondary,
      sidebar,
      toc,
      aside,
      prevNext: '<div data-vp-prev-next></div>',
    },
  }
}
