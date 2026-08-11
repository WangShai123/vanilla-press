import { createHash } from 'crypto';
import fs from 'fs/promises';
import { createRequire } from 'module';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { build as esbuildBuild, transform as esbuildTransform } from 'esbuild';
import { glob } from 'glob';
import { randomId } from 'vanilla-jui';
import { build as viteBuild } from 'vite';

import {
  DEFAULT_CONFIG_TS,
  DEFAULT_FOOTER_SCRIPT_TS,
  DEFAULT_LANGUAGES_TS,
  DEFAULT_LLMS_CONFIG,
  DEFAULT_LLMS_TS,
  DEFAULT_MENU_TS,
  DEFAULT_ROBOTS_CONFIG,
  DEFAULT_ROBOTS_TS,
  DEFAULT_SIDEBAR_TS,
} from './config/defaults.ts';
import { createMarkdown } from './core/md.ts';
import { renderDefaultLocaleEntrypoint, renderHtml } from './render/html.ts';
import { layoutStyles, loadLayouts, renderLayout } from './render/layout.ts';
import type {
  BuildOptions,
  DocConfig,
  FooterScriptConfig,
  FrontmatterData,
  LanguagesConfig,
  LayoutMap,
  PageScriptAsset,
  RenderedPage,
  RuntimeBundleData,
  RuntimeI18nConfig,
  SeoData,
  SharedInlineScriptModule,
  SourcePage,
  UnknownRecord,
} from './types.ts';
import {
  isAuthEnabled,
  isI18nEnabled,
  isInlineScriptEnabled,
  isLlmsEnabled,
  isMenuEnabled,
  isRobotsEnabled,
  isSitemapEnabled,
  isSearchEnabled,
  isSeoEnabled,
  isSidebarEnabled,
  isThemeEnabled,
  runtimeOption,
  isTocEnabled,
} from './utilities/features.ts';
import {
  parseFrontmatter,
  pickSeoFrontmatter,
} from './utilities/frontmatter.ts';
import { cleanHtml, htmlText } from './utilities/html.ts';
import {
  injectLlmsControls,
  markdownRouteRel,
  renderLlmsTxt,
} from './utilities/llms.ts';
import { excerptText, pageTitle } from './utilities/page.ts';
import {
  normalizePath,
  resolveDir,
  stripMdExt,
  toPosix,
} from './utilities/path.ts';
import { renderRobotsTxt } from './utilities/robots.ts';
import { minifyCss, readStyleConfig } from './utilities/style.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const defaultInputDir = path.join(projectRoot, 'docs');
const defaultOutputDir = path.join(projectRoot, 'dist');
const require = createRequire(import.meta.url);

interface DefaultModule<T> {
  default?: T;
}

interface SearchIndexItem {
  title: string;
  rel: string;
  keywords: string;
  description: string;
  excerpt: string;
  content: string;
}

type MarkdownItInstance = ReturnType<typeof createMarkdown>;

const SHARED_INLINE_SCRIPT_MODULES = [
  'vanilla-jui',
  'vanilla-signal',
  'vanilla-create-storage',
  'vanilla-signal-i18n',
] as const satisfies SharedInlineScriptModule[];
const SHARED_INLINE_SCRIPT_RUNTIME_ID = 'vanilla-press/runtime';
const IMPORT_STATEMENT_RE =
  /^(\s*)import\s+(?:(.*?)\s+from\s+)?(['"])([^'"]+)\3\s*;?/gms;

async function pathExists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function importDefault<T>(file: string, fallback: T): Promise<T> {
  const mod = (await import(
    `${pathToFileURL(file).href}?t=${Date.now()}`
  )) as DefaultModule<T>;
  return (mod.default || fallback) as T;
}

async function resolveSourceModule(
  inputDir: string,
  basename: string
): Promise<string | null> {
  const tsFile = path.join(inputDir, `${basename}.ts`);
  if (await pathExists(tsFile)) return tsFile;

  const jsFile = path.join(inputDir, `${basename}.js`);
  if (await pathExists(jsFile)) return jsFile;

  return null;
}

async function ensureSourceConfig(inputDir: string): Promise<void> {
  const files = [
    ['config', DEFAULT_CONFIG_TS],
    ['footerScript', DEFAULT_FOOTER_SCRIPT_TS],
    ['languages', DEFAULT_LANGUAGES_TS],
    ['llms', DEFAULT_LLMS_TS],
    ['menu', DEFAULT_MENU_TS],
    ['robots', DEFAULT_ROBOTS_TS],
    ['sidebar', DEFAULT_SIDEBAR_TS],
  ];

  for (const [basename, content] of files) {
    if (!(await resolveSourceModule(inputDir, basename))) {
      await fs.writeFile(
        path.join(inputDir, `${basename}.ts`),
        content,
        'utf8'
      );
    }
  }
}

async function loadDocConfig(inputDir: string): Promise<DocConfig> {
  const file = await resolveSourceModule(inputDir, 'config');
  if (!file) return {};

  return importDefault<DocConfig>(file, {});
}

async function loadFooterScript(inputDir: string): Promise<FooterScriptConfig> {
  const file = await resolveSourceModule(inputDir, 'footerScript');
  if (!file) return '';

  return importDefault<FooterScriptConfig>(file, '');
}

async function loadRobotsConfig(inputDir: string): Promise<UnknownRecord> {
  const file = await resolveSourceModule(inputDir, 'robots');
  if (!file) return DEFAULT_ROBOTS_CONFIG as UnknownRecord;

  return importDefault<UnknownRecord>(
    file,
    DEFAULT_ROBOTS_CONFIG as UnknownRecord
  );
}

async function loadLlmsConfig(inputDir: string): Promise<UnknownRecord> {
  const file = await resolveSourceModule(inputDir, 'llms');
  if (!file) return DEFAULT_LLMS_CONFIG as UnknownRecord;

  return importDefault<UnknownRecord>(
    file,
    DEFAULT_LLMS_CONFIG as UnknownRecord
  );
}

function validateDocConfig(config: DocConfig = {}): void {
  const siteUrl = String(config.siteUrl || '').trim();

  if (!siteUrl) {
    throw new Error(
      'siteUrl is required. Add siteUrl: "https://your-domain.com" to docs/config.ts.'
    );
  }

  let url;
  try {
    url = new URL(siteUrl);
  } catch {
    throw new Error(
      'siteUrl must be an absolute URL, for example: "https://example.com".'
    );
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(
      'siteUrl must be an http(s) URL, for example: "https://example.com".'
    );
  }
}

async function loadLanguages(inputDir: string): Promise<LanguagesConfig> {
  const file = await resolveSourceModule(inputDir, 'languages');
  if (!file) return {};

  return importDefault<LanguagesConfig>(file, {});
}

function resolveI18nData(
  config: DocConfig = {},
  messages: LanguagesConfig = {}
): LanguagesConfig {
  const i18n = (runtimeOption(config, 'i18n') || {}) as RuntimeI18nConfig;
  const i18nMessages = messages && typeof messages === 'object' ? messages : {};

  return {
    locale: i18n.locale || 'zh-CN',
    fallbackLocale: i18n.fallbackLocale || 'en',
    locales: Array.isArray(i18n.locales) ? i18n.locales : [],
    messages: i18nMessages,
  };
}

async function loadMenuItems(inputDir: string): Promise<unknown[]> {
  const file = await resolveSourceModule(inputDir, 'menu');
  if (!file) return [];

  return importDefault<unknown[]>(file, []);
}

async function loadSidebarItems(inputDir: string): Promise<unknown[]> {
  const file = await resolveSourceModule(inputDir, 'sidebar');
  if (!file) return [];

  return importDefault<unknown[]>(file, []);
}

function resolveDefaultLocale(
  config: DocConfig = {},
  languages: LanguagesConfig = {}
) {
  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  if (!locales.length) return null;

  const i18n = runtimeOption(config, 'i18n') as RuntimeI18nConfig | undefined;
  const preferred = String(i18n?.locale || languages.locale || '')
    .trim()
    .toLowerCase();
  return (
    locales.find(
      (locale) =>
        String(locale.code || '')
          .trim()
          .toLowerCase() === preferred
    ) || locales[0]
  );
}

async function writeDefaultLocaleEntrypoint(
  outputDir: string,
  config: DocConfig = {},
  languages: LanguagesConfig = {},
  pages: RenderedPage[] = [],
  footerScript: FooterScriptConfig = ''
): Promise<void> {
  if (!isI18nEnabled(config)) return;
  const i18n = runtimeOption(config, 'i18n') as RuntimeI18nConfig | undefined;
  if (i18n?.redirectToDefault === false) return;
  if (pages.some((page) => page.rel === 'index.html')) return;

  const locale = resolveDefaultLocale(config, languages);
  const prefix = normalizePath(locale?.path);
  if (prefix) {
    const target = `${prefix}/index.html`;
    const hasTarget = pages.some((page) => page.rel === target);
    if (!hasTarget) return;
  }

  const rootIndexFile = path.join(outputDir, 'index.html');
  const rootLang =
    String(locale?.code || i18n?.locale || languages.locale || 'en').trim() ||
    'en';
  const html = renderDefaultLocaleEntrypoint({
    i18n,
    languages,
    lang: rootLang,
    config,
    footerScript,
  });

  await fs.writeFile(rootIndexFile, html, 'utf8');
  console.warn(`built ${toPosix(path.relative(projectRoot, rootIndexFile))}`);
}

async function buildCss(outputDir: string, layouts: LayoutMap): Promise<void> {
  const configuredCss = await readStyleConfig(
    path.join(projectRoot, 'src/config/externalStyle.ts')
  );
  const customCss = await readStyleConfig(
    path.join(projectRoot, 'src/style.ts')
  );
  const styles = [...configuredCss, ...customCss, ...layoutStyles(layouts)];
  const css = await minifyCss(styles.join('\n\n'));

  await fs.writeFile(path.join(outputDir, 'styles.css'), css, 'utf8');
}

function serializeRuntimeValue(value: unknown): string {
  const serialized = JSON.stringify(value);
  return serialized === undefined ? 'undefined' : serialized;
}

function runtimeSharedInlineExports(
  modules: SharedInlineScriptModule[] = []
): string {
  return Array.from(new Set(modules))
    .sort()
    .map(
      (moduleName) =>
        `export * as ${sharedInlineExportName(moduleName)} from ${JSON.stringify(pathToFileURL(require.resolve(moduleName)).href)};`
    )
    .join('\n');
}

async function writeRuntimeEntry(
  dir: string,
  data: RuntimeBundleData = {}
): Promise<string> {
  const runtimeHref = pathToFileURL(
    path.join(projectRoot, 'src/runtime.ts')
  ).href;
  const sharedExports = runtimeSharedInlineExports(data.sharedInlineModules);
  const code = `import { initDocPage, isMobile } from ${JSON.stringify(runtimeHref)};
export { initDocPage, isMobile };
export const docConfig = ${serializeRuntimeValue(data.config)};
export const languages = ${serializeRuntimeValue(data.languages || {})};
export const menuItems = ${serializeRuntimeValue(data.menuItems || [])};
export const sidebarItems = ${serializeRuntimeValue(data.sidebarItems || [])};
${sharedExports ? `${sharedExports}\n` : ''}
`;
  const file = path.join(dir, 'runtime-entry.js');
  await fs.writeFile(file, code, 'utf8');
  return file;
}

async function buildRuntime(
  outputDir: string,
  data: RuntimeBundleData = {}
): Promise<void> {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'vanilla-press-runtime-')
  );

  try {
    const entry = await writeRuntimeEntry(tempDir, data);

    await viteBuild({
      configFile: false,
      root: projectRoot,
      publicDir: false,
      logLevel: 'warn',
      build: {
        emptyOutDir: false,
        minify: 'oxc',
        outDir: outputDir,
        sourcemap: false,
        target: 'es2020',
        lib: {
          entry,
          formats: ['es'],
          fileName: () => 'runtime.js',
        },
        rollupOptions: {
          output: {
            assetFileNames: 'assets/[name][extname]',
            chunkFileNames: 'assets/[name]-[hash].js',
          },
        },
      },
    });
  } finally {
    await fs.rm(tempDir, { force: true, recursive: true });
  }
}

function hashFileName(fileName: string): string {
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);
  return `${baseName}.${randomId(8)}${ext}`;
}

function contentHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 8);
}

function pageScriptRel(pageRel: string, code: string): string {
  const ext = path.extname(pageRel);
  const base = ext ? pageRel.slice(0, -ext.length) : pageRel;
  return `${base}.${contentHash(code)}.js`;
}

function isSharedInlineScriptModule(
  value: string
): value is SharedInlineScriptModule {
  return SHARED_INLINE_SCRIPT_MODULES.includes(
    value as SharedInlineScriptModule
  );
}

function sharedInlineExportName(moduleName: SharedInlineScriptModule): string {
  return `__vp_${moduleName.replace(/[^a-zA-Z0-9_$]/g, '_')}`;
}

interface InlineImportBinding {
  imported: string;
  local: string;
}

interface ParsedInlineImportClause {
  defaultName: string;
  namespaceName: string;
  named: InlineImportBinding[];
}

function splitImportClause(value: string): string[] {
  const parts: string[] = [];
  let buffer = '';
  let depth = 0;

  for (const char of value) {
    if (char === '{') depth += 1;
    else if (char === '}') depth = Math.max(0, depth - 1);

    if (char === ',' && depth === 0) {
      parts.push(buffer.trim());
      buffer = '';
      continue;
    }

    buffer += char;
  }

  if (buffer.trim()) parts.push(buffer.trim());
  return parts;
}

function parseNamedImportBindings(value: string): InlineImportBinding[] {
  const body = value.trim().replace(/^\{/, '').replace(/\}$/, '');
  if (!body.trim()) return [];

  return body
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^type\s+/, '').trim())
    .map((item) => {
      const parts = item.split(/\s+as\s+/);
      const imported = String(parts[0] || '').trim();
      const local = String(parts[1] || imported).trim();
      return { imported, local };
    })
    .filter((item) => item.imported && item.local);
}

function parseInlineImportClause(clause: string): ParsedInlineImportClause {
  const result: ParsedInlineImportClause = {
    defaultName: '',
    namespaceName: '',
    named: [],
  };
  const parts = splitImportClause(clause);

  for (const part of parts) {
    if (part.startsWith('{')) {
      result.named.push(...parseNamedImportBindings(part));
      continue;
    }

    if (part.startsWith('*')) {
      const match = part.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
      result.namespaceName = match?.[1] || '';
      continue;
    }

    result.defaultName = part.trim();
  }

  return result;
}

function rewriteSharedInlineScriptImports(code: string): {
  code: string;
  sharedModules: SharedInlineScriptModule[];
} {
  const sharedModules = new Set<SharedInlineScriptModule>();
  let index = 0;

  const rewritten = code.replace(
    IMPORT_STATEMENT_RE,
    (statement, indent, rawClause, _quote, source) => {
      if (!isSharedInlineScriptModule(source)) return statement;
      sharedModules.add(source);

      const exportName = sharedInlineExportName(source);
      const tempName = `__vp_shared_${index++}`;
      const clause = String(rawClause || '').trim();

      if (!clause) {
        return `${indent}import { ${exportName} as ${tempName} } from '${SHARED_INLINE_SCRIPT_RUNTIME_ID}';`;
      }

      const parsed = parseInlineImportClause(clause);
      if (parsed.namespaceName) {
        return `${indent}import { ${exportName} as ${parsed.namespaceName} } from '${SHARED_INLINE_SCRIPT_RUNTIME_ID}';`;
      }

      const lines = [
        `${indent}import { ${exportName} as ${tempName} } from '${SHARED_INLINE_SCRIPT_RUNTIME_ID}';`,
      ];

      if (parsed.defaultName) {
        lines.push(
          `${indent}const ${parsed.defaultName} = ${tempName}.default;`
        );
      }

      if (parsed.named.length) {
        const names = parsed.named
          .map(({ imported, local }) =>
            imported === local ? imported : `${imported}: ${local}`
          )
          .join(', ');
        lines.push(`${indent}const { ${names} } = ${tempName};`);
      }

      return lines.join('\n');
    }
  );

  return {
    code: rewritten,
    sharedModules: Array.from(sharedModules).sort(),
  };
}

function createPageScripts(
  source: SourcePage,
  scripts: string[] = []
): PageScriptAsset[] {
  const blocks = scripts.map((script) => script.trim()).filter(Boolean);
  if (!blocks.length) return [];

  const code = `${blocks
    .map((script, index) => `// vp-script ${index + 1}\n${script}`)
    .join('\n\n')}\n`;
  const rewritten = rewriteSharedInlineScriptImports(code);

  return [
    {
      rel: pageScriptRel(source.rel, rewritten.code),
      code: rewritten.code,
      sharedModules: rewritten.sharedModules,
    },
  ];
}

function rewriteAssetReferences(
  html: string,
  assetMap: Map<string, string> = new Map()
): string {
  let output = html;

  for (const [from, to] of assetMap) {
    const pattern = new RegExp(`(["'])([^"']*?)${from}(["'])`, 'g');
    output = output.replace(pattern, `$1$2${to}$3`);
  }

  return output;
}

async function hashRootAssets(outputDir: string): Promise<Map<string, string>> {
  const assetFiles = ['styles.css', 'runtime.js', 'search.js'];

  const assetMap = new Map<string, string>();

  for (const file of assetFiles) {
    const fullPath = path.join(outputDir, file);
    if (!(await pathExists(fullPath))) continue;

    const hashedFile = hashFileName(file);
    await fs.rename(fullPath, path.join(outputDir, hashedFile));
    assetMap.set(file, hashedFile);
  }

  return assetMap;
}

async function rewriteHtmlAssets(
  outputDir: string,
  assetMap: Map<string, string> = new Map()
): Promise<void> {
  const files = (
    await glob('**/*.html', {
      cwd: outputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort();

  await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(outputDir, file);
      const html = await fs.readFile(fullPath, 'utf8');
      const next = rewriteAssetReferences(html, assetMap);
      if (next !== html) {
        await fs.writeFile(fullPath, next, 'utf8');
      }
    })
  );
}

async function minifyJsAssets(outputDir: string): Promise<void> {
  const files = (
    await glob('**/*.js', {
      cwd: outputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort();

  await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(outputDir, file);
      const code = await fs.readFile(fullPath, 'utf8');
      const result = await esbuildTransform(code, {
        format: 'esm',
        legalComments: 'none',
        loader: 'js',
        minify: true,
        target: 'es2020',
      });

      await fs.writeFile(fullPath, result.code.trim(), 'utf8');
    })
  );
  console.warn(`minified js: ${files.length} file(s)`);
}

async function writePageScripts(
  outputDir: string,
  pages: RenderedPage[] = []
): Promise<void> {
  const scripts = pages.flatMap((page) => page.scripts || []);

  await Promise.all(
    scripts.map(async (script) => {
      const outputFile = path.join(outputDir, script.rel);
      const result = await esbuildBuild({
        bundle: true,
        format: 'esm',
        legalComments: 'none',
        minify: false,
        platform: 'browser',
        target: 'es2020',
        write: false,
        external: [SHARED_INLINE_SCRIPT_RUNTIME_ID],
        stdin: {
          contents: script.code,
          loader: 'js',
          resolveDir: projectRoot,
          sourcefile: script.rel,
        },
      });
      const output = result.outputFiles?.[0]?.text || script.code;
      await fs.mkdir(path.dirname(outputFile), { recursive: true });
      await fs.writeFile(outputFile, output, 'utf8');
    })
  );
}

function pageSharedInlineModules(
  pages: RenderedPage[] = []
): SharedInlineScriptModule[] {
  return Array.from(
    new Set(
      pages.flatMap((page) =>
        (page.scripts || []).flatMap((script) => script.sharedModules || [])
      )
    )
  ).sort();
}

function readSource(file: string, markdown: string): SourcePage {
  const frontmatter = parseFrontmatter(markdown) as FrontmatterData;

  return {
    file,
    markdown,
    frontmatter,
    seo: pickSeoFrontmatter(frontmatter) as SeoData,
    rel: toPosix(stripMdExt(file)),
    title: pageTitle(markdown, file),
  };
}

function renderSource(
  source: SourcePage,
  md: MarkdownItInstance,
  config: DocConfig,
  languages: LanguagesConfig,
  layouts: LayoutMap,
  llmsConfig: UnknownRecord,
  footerScript: FooterScriptConfig
): RenderedPage {
  const env = {
    file: source.file,
    components: new Set<string>(),
    inlineScripts: [] as string[],
    config,
  };
  const rendered = md.render(source.markdown, env);
  const scripts = isInlineScriptEnabled()
    ? createPageScripts(source, env.inlineScripts)
    : [];
  const body = injectLlmsControls(
    cleanHtml(rendered),
    source,
    config,
    llmsConfig,
    languages
  );
  const pageLayout = renderLayout({
    body,
    source,
    config,
    sidebarEnabled: isSidebarEnabled(config),
    tocEnabled: isTocEnabled(config),
    chrome: {
      rel: source.rel,
      menuEnabled: isMenuEnabled(config),
      searchEnabled: isSearchEnabled(config),
      i18nEnabled: isI18nEnabled(config),
      sidebarEnabled: isSidebarEnabled(config),
      tocEnabled: isTocEnabled(config),
      themeEnabled: isThemeEnabled(config),
      authEnabled: isAuthEnabled(config),
    },
    layouts,
  });

  return {
    ...source,
    body,
    content: htmlText(body),
    components: Array.from(env.components).sort(),
    scripts,
    html: renderHtml({
      title: source.title,
      seo: isSeoEnabled(config) ? source.seo : {},
      body,
      rel: source.rel,
      components: Array.from(env.components).sort(),
      config,
      languages,
      pageLayout,
      searchEnabled: isSearchEnabled(config),
      runtimeImportMap: scripts.some((script) => script.sharedModules.length),
      scripts: scripts.map((script) => script.rel),
      footerScript,
    }),
  };
}

function createSearchIndex(pages: RenderedPage[] = []): SearchIndexItem[] {
  return pages.map((page) => ({
    title: page.seo?.title || page.title,
    rel: page.rel,
    keywords: page.seo?.keywords || '',
    description: page.seo?.description || '',
    excerpt: excerptText(page.seo?.description || page.content),
    content: page.content,
  }));
}

async function writeSearchIndex(
  outputDir: string,
  pages: RenderedPage[] = []
): Promise<void> {
  const code = `export const searchIndex = ${JSON.stringify(createSearchIndex(pages))};\n`;
  await fs.writeFile(path.join(outputDir, 'search.js'), code, 'utf8');
}

function siteUrl(config: DocConfig = {}): string {
  return String(config.siteUrl || '')
    .trim()
    .replace(/\/+$/g, '');
}

function sitemapLoc(page: Pick<RenderedPage, 'rel'>, baseUrl: string): string {
  const rel = toPosix(page.rel).replace(/^\/+/, '');
  const encodedRel = rel.split('/').map(encodeURIComponent).join('/');
  return `${baseUrl}/${encodedRel}`;
}

function escapeXml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function writeSitemap(
  outputDir: string,
  pages: RenderedPage[] = [],
  config: DocConfig = {}
): Promise<void> {
  const baseUrl = siteUrl(config);
  const urls = pages
    .map(
      (page) =>
        `  <url>\n    <loc>${escapeXml(sitemapLoc(page, baseUrl))}</loc>\n  </url>`
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  await fs.writeFile(path.join(outputDir, 'sitemap.xml'), xml, 'utf8');
}

async function writeRobots(
  outputDir: string,
  robotsConfig: UnknownRecord = {}
): Promise<void> {
  const text = renderRobotsTxt(robotsConfig);
  await fs.writeFile(path.join(outputDir, 'robots.txt'), text, 'utf8');
}

async function writeLlms(
  outputDir: string,
  pages: RenderedPage[] = [],
  config: DocConfig = {},
  llmsConfig: UnknownRecord = {}
): Promise<void> {
  const text = renderLlmsTxt(llmsConfig, config, pages);
  await fs.writeFile(path.join(outputDir, 'llms.txt'), text, 'utf8');

  await Promise.all(
    pages.map(async (page) => {
      const outputFile = path.join(outputDir, markdownRouteRel(page));
      await fs.mkdir(path.dirname(outputFile), { recursive: true });
      await fs.writeFile(outputFile, page.markdown, 'utf8');
    })
  );
}

export async function build({
  inputDir = defaultInputDir,
  outputDir = defaultOutputDir,
}: BuildOptions = {}): Promise<void> {
  if (path.resolve(inputDir) === path.resolve(outputDir)) {
    throw new Error('inputDir and outputDir must be different directories.');
  }

  await fs.mkdir(inputDir, { recursive: true });
  await ensureSourceConfig(inputDir);
  const config = await loadDocConfig(inputDir);
  validateDocConfig(config);
  const footerScript = await loadFooterScript(inputDir);
  const md = createMarkdown(config);
  const layouts = await loadLayouts({ projectRoot, inputDir });

  await fs.rm(outputDir, { force: true, recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  const languages = isI18nEnabled(config)
    ? resolveI18nData(config, await loadLanguages(inputDir))
    : {};
  const menuItems = isMenuEnabled(config) ? await loadMenuItems(inputDir) : [];
  const sidebarItems = isSidebarEnabled(config)
    ? await loadSidebarItems(inputDir)
    : [];
  const llmsConfig = isLlmsEnabled(config)
    ? await loadLlmsConfig(inputDir)
    : {};
  const files = (
    await glob('**/*.md', {
      cwd: inputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort();
  const sources = await Promise.all(
    files.map(async (file) =>
      readSource(file, await fs.readFile(path.join(inputDir, file), 'utf8'))
    )
  );

  await buildCss(outputDir, layouts);

  const pages = sources.map((source) =>
    renderSource(
      source,
      md,
      config,
      languages,
      layouts,
      llmsConfig,
      footerScript
    )
  );
  await buildRuntime(outputDir, {
    config,
    languages,
    menuItems,
    sidebarItems,
    sharedInlineModules: pageSharedInlineModules(pages),
  });
  if (isSearchEnabled(config)) await writeSearchIndex(outputDir, pages);
  if (isSitemapEnabled(config)) await writeSitemap(outputDir, pages, config);
  if (isLlmsEnabled(config)) {
    await writeLlms(outputDir, pages, config, llmsConfig);
  }
  if (isRobotsEnabled(config)) {
    await writeRobots(outputDir, await loadRobotsConfig(inputDir));
  }
  await writePageScripts(outputDir, pages);

  for (const page of pages) {
    const outputFile = path.join(outputDir, page.rel);
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, page.html, 'utf8');
    console.warn(`built: ${toPosix(path.relative(projectRoot, outputFile))}`);
  }

  await writeDefaultLocaleEntrypoint(
    outputDir,
    config,
    languages,
    pages,
    footerScript
  );
  await minifyJsAssets(outputDir);
  const assetMap = await hashRootAssets(outputDir);
  await rewriteHtmlAssets(outputDir, assetMap);

  console.warn(
    `done: ${pages.length} page(s), ${toPosix(path.relative(projectRoot, outputDir))}`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build({
    inputDir: resolveDir(projectRoot, process.argv[2], defaultInputDir),
    outputDir: resolveDir(projectRoot, process.argv[3], defaultOutputDir),
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
