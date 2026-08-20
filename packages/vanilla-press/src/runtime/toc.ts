import { createToc, q } from 'vanilla-jui'

import type { RuntimeConfig } from '../types.ts'
import { tocOptions } from '../utilities/features.ts'

export function initToc(config: RuntimeConfig = {}): void {
  const toc = q<HTMLElement>('[data-vp-toc]')
  const article = q<HTMLElement>('.j-editor')
  if (!toc || !article || toc.dataset.vpReady === 'true') return

  const { headings, offset } = tocOptions(config)
  if (!q(headings, article)) {
    toc.hidden = true
    return
  }

  toc.textContent = ''
  const instance = createToc({
    target: article,
    headings,
    offset,
  })
  instance.mount(toc)
  toc.dataset.vpReady = 'true'
}
