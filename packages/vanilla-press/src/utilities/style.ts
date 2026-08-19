import fs from 'fs/promises'
import { createRequire } from 'module'
import path from 'path'
import { pathToFileURL } from 'url'

import {
  build as esbuildBuild,
  transform as esbuildTransform,
  type Plugin,
} from 'esbuild'

import { toText } from './string.ts'

const require = createRequire(import.meta.url)

interface PackageParts {
  name: string
  subpath: string
}

interface StyleConfigModule {
  default?: unknown
  styles?: unknown
  styleSources?: unknown
}

function flattenStyles(styles: unknown): unknown[] {
  if (!Array.isArray(styles)) return styles ? [styles] : []

  return styles.flatMap((style) => flattenStyles(style))
}

function packageParts(specifier: string): PackageParts {
  const parts = specifier.split('/')
  if (specifier.startsWith('@')) {
    return {
      name: parts.slice(0, 2).join('/'),
      subpath: parts.slice(2).join('/'),
    }
  }

  return {
    name: parts[0],
    subpath: parts.slice(1).join('/'),
  }
}

function stripImportQuery(specifier: unknown): string {
  return toText(specifier).replace(/[?#].*$/u, '')
}

function resolvePackageStyle(specifier: string): string {
  const { name, subpath } = packageParts(specifier)

  if (subpath) {
    const packageJson = require.resolve(`${name}/package.json`)
    return path.join(path.dirname(packageJson), subpath)
  }

  return require.resolve(specifier)
}

function resolveCssImport(specifier: string, importer?: string): string {
  const cleanSpecifier = stripImportQuery(specifier)
  const baseDir = importer ? path.dirname(importer) : process.cwd()

  if (path.isAbsolute(cleanSpecifier)) return cleanSpecifier
  if (cleanSpecifier.startsWith('.')) {
    return path.resolve(baseDir, cleanSpecifier)
  }

  return resolvePackageStyle(cleanSpecifier)
}

function cssTextPlugin(): Plugin {
  return {
    name: 'css-text',
    setup(build) {
      build.onResolve({ filter: /\.css([?#].*)?$/ }, (args) => ({
        path: resolveCssImport(args.path, args.importer),
      }))
      build.onLoad({ filter: /\.css$/ }, async (args) => ({
        contents: await fs.readFile(args.path, 'utf8'),
        loader: 'text',
      }))
    },
  }
}

async function importBundledStyleConfig(
  file: string
): Promise<StyleConfigModule> {
  const result = await esbuildBuild({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
    plugins: [cssTextPlugin()],
  })

  const code = result.outputFiles[0]?.text || ''
  const href = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  return import(href) as Promise<StyleConfigModule>
}

function configValueLength(value: unknown): number {
  const length = (value as { length?: unknown })?.length
  return typeof length === 'number' ? length : 0
}

export async function readStyleConfig(file: string): Promise<string[]> {
  const mod = await importBundledStyleConfig(file)
  const styles = mod.default || mod.styles || mod.styleSources || []

  if (!configValueLength(styles)) {
    throw new Error(
      `Style config ${pathToFileURL(file).href} must export a CSS array as default, styles, or styleSources.`
    )
  }

  return flattenStyles(styles)
    .map((style) => toText(style).trim())
    .filter(Boolean)
}

export async function minifyCss(css: unknown): Promise<string> {
  const result = await esbuildTransform(toText(css), {
    legalComments: 'none',
    loader: 'css',
    minify: true,
  })

  return result.code.trim()
}
