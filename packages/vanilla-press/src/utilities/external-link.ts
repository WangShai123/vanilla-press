import { JSDOM } from 'jsdom'
import { addIcons, iconHtml } from 'vanilla-jui'

import icons from '../config/icons.ts'
import type { RuntimeConfig } from '../types.ts'
import { isExternalLinkEnabled } from './features.ts'

addIcons(icons)

const EXTERNAL_LINK_SELECTOR = 'a[href^="http://"], a[href^="https://"]'
const EXTERNAL_LINK_SCOPE_SELECTOR =
  '[data-vp-editor], [data-vp-menu], [data-vp-mobile-menu-nav], [data-vp-sidebar]'
const EXTERNAL_LINK_READY_ATTR = 'data-vp-external-link'
const EXTERNAL_LINK_ICON_ATTR = 'data-vp-external-link-icon'

function appendExternalIcon(document: Document, link: HTMLAnchorElement): void {
  if (link.querySelector(`[${EXTERNAL_LINK_ICON_ATTR}]`)) return

  const span = document.createElement('span')
  span.className = 'external-link'
  span.innerHTML = iconHtml('arrow-right-up-line').replace(
    '<svg ',
    `<svg ${EXTERNAL_LINK_ICON_ATTR}="true" `
  )
  link.append(span)
}

function applyExternalLink(link: HTMLAnchorElement): void {
  if (link.closest('.vp-editor-help')) return

  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.setAttribute(EXTERNAL_LINK_READY_ATTR, 'true')
  appendExternalIcon(link.ownerDocument, link)
}

function applyExternalLinks(root: Document | DocumentFragment): void {
  root
    .querySelectorAll<HTMLElement>(EXTERNAL_LINK_SCOPE_SELECTOR)
    .forEach((scope) => {
      scope
        .querySelectorAll<HTMLAnchorElement>(EXTERNAL_LINK_SELECTOR)
        .forEach(applyExternalLink)
    })
}

export function renderExternalLinks(
  html = '',
  config: RuntimeConfig = {}
): string {
  if (!isExternalLinkEnabled(config)) return html

  const dom = new JSDOM(`<main>${html}</main>`)
  const document = dom.window.document

  applyExternalLinks(document)
  document
    .querySelectorAll<HTMLTemplateElement>('template')
    .forEach((template) => applyExternalLinks(template.content))

  return document.querySelector('main')?.innerHTML || html
}
