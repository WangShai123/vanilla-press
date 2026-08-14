import type { DocConfig } from '../../types.ts';

interface ShellOptions {
  body: string;
  config: DocConfig;
  sidebarEnabled: boolean;
  tocEnabled: boolean;
}

interface AsideOptions {
  config: DocConfig;
  toc: string;
}

interface ShellContextOptions {
  config: DocConfig;
  sidebarEnabled: boolean;
  tocEnabled: boolean;
  header?: string;
  secondary?: string;
}

function renderSidebar(sidebarEnabled: boolean): string {
  return sidebarEnabled
    ? `    <aside class="doc-sidebar">
      <nav class="doc-nav" data-doc-sidebar aria-label="文档导航"></nav>
    </aside>`
    : '';
}

function renderToc(tocEnabled: boolean): string {
  return tocEnabled
    ? '        <div class="doc-toc" data-doc-toc aria-label="页面目录"></div>'
    : '';
}

function renderAside({ config, toc }: AsideOptions): string {
  return toc || config.aside?.html
    ? `      <aside class="doc-aside" data-reveal="2">
${toc}
        <div class="doc-aside-custom" data-doc-aside-custom></div>
      </aside>`
    : '';
}

export function renderPageShell({
  body,
  config,
  sidebarEnabled,
  tocEnabled,
}: ShellOptions): string {
  const sidebar = renderSidebar(sidebarEnabled);
  const toc = renderToc(tocEnabled);
  const aside = renderAside({ config, toc });
  const hasAside = Boolean(aside);

  return `<main class="doc-shell${sidebarEnabled ? ' has-sidebar' : ''}">
${sidebar}
    <section class="doc-main${hasAside ? ' has-aside' : ''}">
      <div data-reveal>
        <article class="j-content is-sm" data-doc-editor>
          ${body}
        </article>
      </div>
${aside}
    </section>
  </main>
  <footer class="doc-footer" data-doc-footer></footer>`;
}

export function createPageShellContext({
  config,
  sidebarEnabled,
  tocEnabled,
  header = '',
  secondary = '',
}: ShellContextOptions) {
  const sidebar = renderSidebar(sidebarEnabled);
  const toc = renderToc(tocEnabled);
  const aside = renderAside({ config, toc });
  const hasAside = Boolean(aside);

  return {
    shell: {
      className: `doc-shell${sidebarEnabled ? ' has-sidebar' : ''}`,
      mainClassName: `doc-main${hasAside ? ' has-aside' : ''}`,
    },
    slots: {
      header,
      secondary,
      sidebar,
      toc,
      aside,
      prevNext: '<div data-doc-prev-next></div>',
    },
  };
}
