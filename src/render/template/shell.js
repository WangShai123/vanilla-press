function renderSidebar(sidebarEnabled) {
  return sidebarEnabled
    ? `    <aside class="doc-sidebar">
      <nav class="doc-nav" data-doc-sidebar aria-label="文档导航"></nav>
    </aside>`
    : "";
}

function renderToc(tocEnabled) {
  return tocEnabled ? '        <div class="doc-toc" data-doc-toc aria-label="页面目录"></div>' : "";
}

function renderAside({ config, toc }) {
  return toc || config.aside?.html
    ? `      <aside class="doc-aside">
${toc}
        <div class="doc-aside-custom" data-doc-aside-custom></div>
      </aside>`
    : "";
}

export function renderPageShell({ body, config, sidebarEnabled, tocEnabled }) {
  const sidebar = renderSidebar(sidebarEnabled);
  const toc = renderToc(tocEnabled);
  const aside = renderAside({ config, toc });
  const hasAside = Boolean(aside);

  return `<main class="doc-shell${sidebarEnabled ? " has-sidebar" : ""}">
${sidebar}
    <section class="doc-main${hasAside ? " has-aside" : ""}">
      <div>
        <article class="j-content is-sm">
          ${body}
        </article>
      </div>
${aside}
    </section>
  </main>
  <footer class="doc-footer" data-doc-footer></footer>`;
}
