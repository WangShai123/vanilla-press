import fs from 'fs/promises'
import path from 'path'

import { glob } from 'glob'

import {
  isRecord,
  type ChromeOptions,
  type RuntimeConfig,
  type FrontmatterData,
  type LayoutDefinition,
  type LayoutMap,
  type LayoutSource,
  type PageLayout,
  type SourcePage,
  type UnknownRecord,
} from '../types.ts'
import {
  renderHeaderTemplates,
  renderSecondaryTemplate,
} from './template/chrome.ts'
import { renderTemplate } from './template/engine.ts'
import { createPageShellContext } from './template/shell.ts'

const defaultLayoutName = 'default'

interface LoadLayoutsOptions {
  packageRoot: string
  layoutsDir: string
}

interface RenderLayoutOptions {
  body: string
  editorHelp?: string
  source: SourcePage
  config: RuntimeConfig
  sidebarEnabled: boolean
  tocEnabled: boolean
  chrome: ChromeOptions
  layouts: LayoutMap
}

async function pathExists(file: string): Promise<boolean> {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

function assertLayoutName(name: string): void {
  if (!/^[A-Za-z][\w-]*$/.test(name)) {
    throw new Error(
      `Invalid layout name "${name}". Layout names must match /^[A-Za-z][\\w-]*$/.`
    )
  }
}

async function readLayout(
  root: string,
  name: string,
  source: LayoutSource
): Promise<LayoutDefinition | null> {
  assertLayoutName(name)

  const dir = path.join(root, name)
  const templateFile = path.join(dir, 'template.html')
  if (!(await pathExists(templateFile))) return null

  const styleFile = path.join(dir, 'style.css')
  const tsScriptFile = path.join(dir, 'script.ts')
  const jsScriptFile = path.join(dir, 'script.js')
  const scriptFile = (await pathExists(tsScriptFile))
    ? tsScriptFile
    : (await pathExists(jsScriptFile))
      ? jsScriptFile
      : undefined
  return {
    name,
    source,
    dir,
    template: await fs.readFile(templateFile, 'utf8'),
    style: (await pathExists(styleFile))
      ? await fs.readFile(styleFile, 'utf8')
      : '',
    scriptFile,
  }
}

async function readLayoutRoot(
  root: string,
  source: LayoutSource
): Promise<(LayoutDefinition | null)[]> {
  if (!(await pathExists(root))) return []

  const files = (
    await glob('*/template.html', {
      cwd: root,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort()

  return Promise.all(
    files.map((file) => readLayout(root, file.split('/')[0], source))
  )
}

export async function loadLayouts({
  packageRoot,
  layoutsDir,
}: LoadLayoutsOptions): Promise<LayoutMap> {
  const layouts: LayoutMap = new Map()
  const roots: { dir: string; source: LayoutSource }[] = [
    { dir: path.join(packageRoot, 'src/layouts'), source: 'src' },
    { dir: layoutsDir, source: 'vp' },
  ]

  for (const root of roots) {
    const entries = await readLayoutRoot(root.dir, root.source)
    for (const entry of entries) {
      if (entry) layouts.set(entry.name, entry)
    }
  }

  if (!layouts.has(defaultLayoutName)) {
    throw new Error(
      'Missing required layout "default". Add src/layouts/default/template.html.'
    )
  }

  return layouts
}

export function layoutStyles(layouts: LayoutMap = new Map()): string[] {
  return Array.from(layouts.values())
    .map((layout) => layout.style.trim())
    .filter(Boolean)
}

export function pageLayoutName(frontmatter: FrontmatterData = {}): string {
  const name =
    String(frontmatter.layout || defaultLayoutName).trim() || defaultLayoutName
  assertLayoutName(name)
  return name
}

function scopedLayoutData(
  frontmatter: FrontmatterData = {},
  name = defaultLayoutName
): UnknownRecord {
  const scopes = frontmatter.layouts
  if (isRecord(scopes) && isRecord(scopes[name])) {
    return scopes[name]
  }

  const direct = frontmatter[name]
  if (isRecord(direct)) return direct

  return {}
}

export function renderLayout({
  body,
  editorHelp = '',
  source,
  config,
  sidebarEnabled,
  tocEnabled,
  chrome,
  layouts,
}: RenderLayoutOptions): PageLayout {
  const name = pageLayoutName(source.frontmatter)
  const layout = layouts.get(name)
  if (!layout) {
    throw new Error(
      `Unknown layout "${name}" in ${source.file}. Add ${name}/template.html under vp/layouts.`
    )
  }

  const shellContext = createPageShellContext({
    config,
    sidebarEnabled,
    tocEnabled,
    header: renderHeaderTemplates(chrome),
    secondary: renderSecondaryTemplate(chrome),
  })
  const context = {
    ...shellContext,
    content: body,
    editorHelp,
    title: source.seo?.title || source.title,
    description: source.seo?.description || '',
    keywords: source.seo?.keywords || '',
    page: {
      title: source.title,
      rel: source.rel,
      frontmatter: source.frontmatter,
    },
    site: config,
    layout: scopedLayoutData(source.frontmatter, name),
    layouts: source.frontmatter.layouts || {},
  }

  return {
    name,
    html: renderTemplate(layout.template, context),
  }
}
