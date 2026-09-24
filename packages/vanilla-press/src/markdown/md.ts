import MarkdownIt from 'markdown-it'
import type { MarkdownIt as MarkdownItType } from 'markdown-it'
import anchor from 'markdown-it-anchor'
import attrs from 'markdown-it-attrs'
import frontMatter from 'markdown-it-front-matter'
import mathjax3 from 'markdown-it-mathjax3'

import { installAccordion } from '../components/accordion.ts'
import { installBadge } from '../components/badge.ts'
import { installDetails } from '../components/details.ts'
import { installOffcanvas } from '../components/offcanvas.ts'
import { installTabs } from '../components/tabs.ts'
import { installTip } from '../components/tip.ts'
import { installTree } from '../components/tree.ts'
import type { RuntimeConfig, LoadedMarkdownComponent } from '../types.ts'
import { escapeHtml } from '../utilities/html.ts'
import { markComponent } from '../utilities/markdown.ts'
import { installCodeHighlight } from './highlight.ts'

function installCustomComponents(
  md: MarkdownItType,
  components: LoadedMarkdownComponent[] = []
): void {
  for (const component of components) {
    if (typeof component.install !== 'function') continue
    component.install(md, {
      markComponent,
      escapeHtml,
    })
  }
}

export async function createMarkdown(
  config: RuntimeConfig = {},
  components: LoadedMarkdownComponent[] = [],
  languages: string[] = []
): Promise<MarkdownItType> {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  })

  await installCodeHighlight(md, config, languages)
  md.use(frontMatter, () => {})
  md.use(mathjax3)
  md.use(attrs)
  md.use(anchor, {
    level: [2, 3],
    permalinkSymbol: '#',
  })
  installBadge(md)
  installDetails(md)
  installTabs(md)
  installAccordion(md)
  installOffcanvas(md)
  installTip(md)
  installTree(md)
  installCustomComponents(md, components)

  return md
}
