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
  LoadedMarkdownComponent,
  ModuleScriptAsset,
  PageScriptAsset,
  RenderedPage,
  RuntimeBundleData,
  RuntimeI18nConfig,
  SeoData,
  SharedVpScriptModule,
  SourcePage,
  UnknownRecord,
} from './types.ts';
import { loadCustomComponents } from './utilities/components.ts';
import {
  isAuthEnabled,
  isI18nEnabled,
  isVpScriptEnabled,
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
const packageRoot = path.resolve(__dirname, '..');
const workingRoot = process.cwd();
const defaultProjectDir = path.join(workingRoot, 'vp');
const defaultAssetsDir = path.join(workingRoot, 'assets');
const defaultInputDir = path.join(workingRoot, 'docs');
const defaultOutputDir = path.join(workingRoot, 'dist');
const defaultConfigDir = path.join(defaultProjectDir, 'config');
const defaultLayoutsDir = path.join(defaultProjectDir, 'layouts');
const defaultComponentsDir = path.join(defaultProjectDir, 'components');
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

const SHARED_VP_SCRIPT_MODULES = [
  'vanilla-jui',
  'vanilla-signal',
  'vanilla-create-storage',
  'vanilla-signal-i18n',
] satisfies SharedVpScriptModule[];
const SHARED_VP_SCRIPT_RUNTIME_ID = 'vanilla-press/runtime';
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
  sourceDir: string,
  basename: string
): Promise<string | null> {
  const tsFile = path.join(sourceDir, `${basename}.ts`);
  if (await pathExists(tsFile)) return tsFile;

  const jsFile = path.join(sourceDir, `${basename}.js`);
  if (await pathExists(jsFile)) return jsFile;

  return null;
}

async function ensureSourceConfig(configDir: string): Promise<void> {
  const files = [
    ['config', DEFAULT_CONFIG_TS],
    ['footerScript', DEFAULT_FOOTER_SCRIPT_TS],
    ['languages', DEFAULT_LANGUAGES_TS],
    ['llms', DEFAULT_LLMS_TS],
    ['menu', DEFAULT_MENU_TS],
    ['robots', DEFAULT_ROBOTS_TS],
    ['sidebar', DEFAULT_SIDEBAR_TS],
  ];

  await fs.mkdir(configDir, { recursive: true });

  for (const [basename, content] of files) {
    if (!(await resolveSourceModule(configDir, basename))) {
      await fs.writeFile(
        path.join(configDir, `${basename}.ts`),
        content,
        'utf8'
      );
    }
  }
}

async function loadDocConfig(configDir: string): Promise<DocConfig> {
  const file = await resolveSourceModule(configDir, 'config');
  if (!file) return {};

  return importDefault<DocConfig>(file, {});
}

async function loadFooterScript(
  configDir: string
): Promise<FooterScriptConfig> {
  const file = await resolveSourceModule(configDir, 'footerScript');
  if (!file) return '';

  return importDefault<FooterScriptConfig>(file, '');
}

async function loadRobotsConfig(configDir: string): Promise<UnknownRecord> {
  const file = await resolveSourceModule(configDir, 'robots');
  if (!file) return DEFAULT_ROBOTS_CONFIG as UnknownRecord;

  return importDefault<UnknownRecord>(
    file,
    DEFAULT_ROBOTS_CONFIG as UnknownRecord
  );
}

async function loadLlmsConfig(configDir: string): Promise<UnknownRecord> {
  const file = await resolveSourceModule(configDir, 'llms');
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
      'siteUrl is required. Add siteUrl: "https://your-domain.com" to vp/config/config.ts.'
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

async function loadLanguages(configDir: string): Promise<LanguagesConfig> {
  const file = await resolveSourceModule(configDir, 'languages');
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

async function loadMenuItems(configDir: string): Promise<unknown[]> {
  const file = await resolveSourceModule(configDir, 'menu');
  if (!file) return [];

  return importDefault<unknown[]>(file, []);
}

async function loadSidebarItems(configDir: string): Promise<unknown[]> {
  const file = await resolveSourceModule(configDir, 'sidebar');
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
  console.warn(`built ${toPosix(path.relative(workingRoot, rootIndexFile))}`);
}

async function buildCss(outputDir: string, layouts: LayoutMap): Promise<void> {
  const configuredCss = await readStyleConfig(
    path.join(packageRoot, 'src/config/externalStyle.ts')
  );
  const customCss = await readStyleConfig(
    path.join(packageRoot, 'src/style.ts')
  );
  const styles = [...configuredCss, ...customCss, ...layoutStyles(layouts)];
  const css = await minifyCss(styles.join('\n\n'));

  await fs.writeFile(path.join(outputDir, 'styles.css'), css, 'utf8');
}

async function copyStaticAssets(
  assetsDir: string,
  publicDir: string
): Promise<void> {
  if (!(await pathExists(assetsDir))) return;

  await fs.cp(assetsDir, publicDir, {
    recursive: true,
    filter: (file) => !file.endsWith(`${path.sep}.DS_Store`),
  });
}

function serializeRuntimeValue(value: unknown): string {
  const serialized = JSON.stringify(value);
  return serialized === undefined ? 'undefined' : serialized;
}

function runtimeSharedVpExports(modules: SharedVpScriptModule[] = []): string {
  return Array.from(new Set(modules))
    .sort()
    .map(
      (moduleName) =>
        `export * as ${sharedVpExportName(moduleName)} from ${JSON.stringify(pathToFileURL(require.resolve(moduleName)).href)};`
    )
    .join('\n');
}

async function writeRuntimeEntry(
  dir: string,
  data: RuntimeBundleData = {}
): Promise<string> {
  const runtimeHref = pathToFileURL(
    path.join(packageRoot, 'src/runtime.ts')
  ).href;
  const sharedExports = runtimeSharedVpExports(data.sharedVpModules);
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
      root: workingRoot,
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

function publicAssetRel(file: string): string {
  const rel = toPosix(file)
    .replace(/^\/+/, '')
    .replace(/^public\//, '');
  return `public/${rel}`;
}

function moduleScriptRel(name: string, code: string): string {
  return publicAssetRel(`${name}.${contentHash(code)}.js`);
}

function pageScriptRel(pageRel: string, code: string): string {
  const ext = path.extname(pageRel);
  const base = ext ? pageRel.slice(0, -ext.length) : pageRel;
  return publicAssetRel(`${base}.${contentHash(code)}.js`);
}

function componentRuntimeEntry(component: LoadedMarkdownComponent): string {
  if (component.runtimeExport === 'component') {
    return `import { component as definition } from ${JSON.stringify(component.file)};
export const name = ${JSON.stringify(component.name)};
export const dependsOn = ${JSON.stringify(component.dependsOn || [])};
export const init = definition.init;
export default { name, dependsOn, init };
`;
  }

  if (component.runtimeExport === 'named') {
    return `import { init as componentInit } from ${JSON.stringify(component.file)};
export const name = ${JSON.stringify(component.name)};
export const dependsOn = ${JSON.stringify(component.dependsOn || [])};
export const init = componentInit;
export default { name, dependsOn, init };
`;
  }

  return `import definition from ${JSON.stringify(component.file)};
export const name = ${JSON.stringify(component.name)};
export const dependsOn = ${JSON.stringify(component.dependsOn || [])};
export const init = definition.init;
export default { name, dependsOn, init };
`;
}

function vpScriptSharedModules(config: DocConfig = {}): SharedVpScriptModule[] {
  const vpScript = runtimeOption(config, 'vpScript');
  const shared =
    vpScript && typeof vpScript === 'object'
      ? (vpScript as UnknownRecord).shared
      : [];
  const configured = Array.isArray(shared)
    ? shared
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return Array.from(
    new Set([...SHARED_VP_SCRIPT_MODULES, ...configured])
  ).sort();
}

function isSharedVpScriptModule(
  value: string,
  sharedModules: SharedVpScriptModule[] = SHARED_VP_SCRIPT_MODULES
): value is SharedVpScriptModule {
  return sharedModules.includes(value);
}

function sharedVpExportName(moduleName: SharedVpScriptModule): string {
  return `__vp_${moduleName.replace(/[^a-zA-Z0-9_$]/g, '_')}_${contentHash(moduleName)}`;
}

interface VpImportBinding {
  imported: string;
  local: string;
}

interface ParsedVpImportClause {
  defaultName: string;
  namespaceName: string;
  named: VpImportBinding[];
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

function parseNamedImportBindings(value: string): VpImportBinding[] {
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

function parseVpImportClause(clause: string): ParsedVpImportClause {
  const result: ParsedVpImportClause = {
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

function rewriteSharedVpScriptImports(
  code: string,
  sharedVpModules: SharedVpScriptModule[] = SHARED_VP_SCRIPT_MODULES
): {
  code: string;
  sharedVpModules: SharedVpScriptModule[];
} {
  const sharedVpModuleSet = new Set<SharedVpScriptModule>();
  let index = 0;

  const rewritten = code.replace(
    IMPORT_STATEMENT_RE,
    (statement, indent, rawClause, _quote, source) => {
      if (!isSharedVpScriptModule(source, sharedVpModules)) {
        return statement;
      }
      sharedVpModuleSet.add(source);

      const exportName = sharedVpExportName(source);
      const tempName = `__vp_shared_${index++}`;
      const clause = String(rawClause || '').trim();

      if (!clause) {
        return `${indent}import { ${exportName} as ${tempName} } from '${SHARED_VP_SCRIPT_RUNTIME_ID}';`;
      }

      const parsed = parseVpImportClause(clause);
      if (parsed.namespaceName) {
        return `${indent}import { ${exportName} as ${parsed.namespaceName} } from '${SHARED_VP_SCRIPT_RUNTIME_ID}';`;
      }

      const lines = [
        `${indent}import { ${exportName} as ${tempName} } from '${SHARED_VP_SCRIPT_RUNTIME_ID}';`,
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
    sharedVpModules: Array.from(sharedVpModuleSet).sort(),
  };
}

function createPageScripts(
  source: SourcePage,
  scripts: string[] = [],
  sharedVpModules: SharedVpScriptModule[] = SHARED_VP_SCRIPT_MODULES
): PageScriptAsset[] {
  const blocks = scripts.map((script) => script.trim()).filter(Boolean);
  if (!blocks.length) return [];

  const code = `${blocks
    .map((script, index) => `// vp-script ${index + 1}\n${script}`)
    .join('\n\n')}\n`;
  const rewritten = rewriteSharedVpScriptImports(code, sharedVpModules);

  return [
    {
      rel: pageScriptRel(source.rel, rewritten.code),
      code: rewritten.code,
      sharedVpModules: rewritten.sharedVpModules,
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
  const publicDir = path.join(outputDir, 'public');
  const assetFiles = ['styles.css', 'runtime.js', 'search.js'];

  const assetMap = new Map<string, string>();

  for (const file of assetFiles) {
    const fullPath = path.join(publicDir, file);
    if (!(await pathExists(fullPath))) continue;

    const hashedFile = hashFileName(file);
    await fs.rename(fullPath, path.join(publicDir, hashedFile));
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
        external: [SHARED_VP_SCRIPT_RUNTIME_ID],
        stdin: {
          contents: script.code,
          loader: 'js',
          resolveDir: workingRoot,
          sourcefile: script.rel,
        },
      });
      const output = result.outputFiles?.[0]?.text || script.code;
      await fs.mkdir(path.dirname(outputFile), { recursive: true });
      await fs.writeFile(outputFile, output, 'utf8');
    })
  );
}

async function bundleModuleScript(
  outputDir: string,
  name: string,
  code: string,
  sourcefile: string
): Promise<string> {
  const result = await esbuildBuild({
    bundle: true,
    format: 'esm',
    legalComments: 'none',
    minify: false,
    platform: 'browser',
    target: 'es2020',
    write: false,
    stdin: {
      contents: code,
      loader: 'js',
      resolveDir: workingRoot,
      sourcefile,
    },
  });
  const output = result.outputFiles?.[0]?.text || code;
  const rel = moduleScriptRel(name, output);

  await fs.writeFile(path.join(outputDir, rel), output, 'utf8');
  return rel;
}

async function buildComponentScripts(
  outputDir: string,
  components: LoadedMarkdownComponent[] = []
): Promise<Map<string, ModuleScriptAsset>> {
  const assets = new Map<string, ModuleScriptAsset>();

  await Promise.all(
    components
      .filter((component) => typeof component.init === 'function')
      .map(async (component) => {
        const code = componentRuntimeEntry(component);
        const rel = await bundleModuleScript(
          outputDir,
          component.name,
          code,
          `${component.name}.component-entry.js`
        );

        assets.set(component.name, {
          name: component.name,
          rel,
          file: component.file,
          dependsOn: component.dependsOn,
        });
      })
  );

  return assets;
}

async function buildLayoutScripts(
  outputDir: string,
  layouts: LayoutMap
): Promise<Map<string, ModuleScriptAsset>> {
  const assets = new Map<string, ModuleScriptAsset>();

  await Promise.all(
    Array.from(layouts.values())
      .filter((layout) => layout.scriptFile)
      .map(async (layout) => {
        const scriptFile = String(layout.scriptFile);
        const code = `export { default } from ${JSON.stringify(scriptFile)};
`;
        const rel = await bundleModuleScript(
          outputDir,
          layout.name,
          code,
          `${layout.name}.layout-entry.js`
        );

        assets.set(layout.name, {
          name: layout.name,
          rel,
          file: scriptFile,
        });
      })
  );

  return assets;
}

function pageComponentScripts(
  components: string[] = [],
  assets: Map<string, ModuleScriptAsset> = new Map()
): ModuleScriptAsset[] {
  const result = new Map<string, ModuleScriptAsset>();
  const stack = [...components];

  while (stack.length) {
    const name = stack.pop();
    if (!name || result.has(name)) continue;

    const asset = assets.get(name);
    if (!asset) continue;
    result.set(name, asset);

    for (const dependency of asset.dependsOn || []) {
      if (!result.has(dependency)) stack.push(dependency);
    }
  }

  return Array.from(result.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function pageSharedVpModules(
  pages: RenderedPage[] = []
): SharedVpScriptModule[] {
  return Array.from(
    new Set(
      pages.flatMap((page) =>
        (page.scripts || []).flatMap((script) => script.sharedVpModules || [])
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
  componentScriptAssets: Map<string, ModuleScriptAsset>,
  layoutScriptAssets: Map<string, ModuleScriptAsset>,
  llmsConfig: UnknownRecord,
  footerScript: FooterScriptConfig
): RenderedPage {
  const env = {
    file: source.file,
    components: new Set<string>(),
    vpScripts: [] as string[],
    config,
  };
  const rendered = md.render(source.markdown, env);
  const sharedVpModules = vpScriptSharedModules(config);
  const scripts = isVpScriptEnabled()
    ? createPageScripts(source, env.vpScripts, sharedVpModules)
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
  const components = Array.from(env.components).sort();
  const componentScripts = pageComponentScripts(
    components,
    componentScriptAssets
  );
  const layoutScript = layoutScriptAssets.get(pageLayout.name) || null;

  return {
    ...source,
    body,
    content: htmlText(body),
    components,
    componentScripts,
    layoutScript,
    scripts,
    html: renderHtml({
      title: source.title,
      seo: isSeoEnabled(config) ? source.seo : {},
      body,
      rel: source.rel,
      components,
      componentScripts: componentScripts.map((script) => script.rel),
      layoutScript: layoutScript?.rel,
      config,
      languages,
      pageLayout,
      searchEnabled: isSearchEnabled(config),
      runtimeImportMap: scripts.some((script) => script.sharedVpModules.length),
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
  assetsDir = defaultAssetsDir,
  configDir = defaultConfigDir,
  layoutsDir = defaultLayoutsDir,
  componentsDir = defaultComponentsDir,
}: BuildOptions = {}): Promise<void> {
  if (path.resolve(inputDir) === path.resolve(outputDir)) {
    throw new Error('inputDir and outputDir must be different directories.');
  }

  await fs.mkdir(inputDir, { recursive: true });
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.mkdir(layoutsDir, { recursive: true });
  await fs.mkdir(componentsDir, { recursive: true });
  await ensureSourceConfig(configDir);
  const config = await loadDocConfig(configDir);
  validateDocConfig(config);
  const footerScript = await loadFooterScript(configDir);
  const customComponents = await loadCustomComponents(componentsDir);
  const md = createMarkdown(config, customComponents);
  const layouts = await loadLayouts({ packageRoot, layoutsDir });

  await fs.rm(outputDir, { force: true, recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  const publicDir = path.join(outputDir, 'public');
  await fs.mkdir(publicDir, { recursive: true });
  await copyStaticAssets(assetsDir, publicDir);

  const languages = isI18nEnabled(config)
    ? resolveI18nData(config, await loadLanguages(configDir))
    : {};
  const menuItems = isMenuEnabled(config) ? await loadMenuItems(configDir) : [];
  const sidebarItems = isSidebarEnabled(config)
    ? await loadSidebarItems(configDir)
    : [];
  const llmsConfig = isLlmsEnabled(config)
    ? await loadLlmsConfig(configDir)
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

  await buildCss(publicDir, layouts);
  const componentScriptAssets = await buildComponentScripts(
    outputDir,
    customComponents
  );
  const layoutScriptAssets = await buildLayoutScripts(outputDir, layouts);

  const pages = sources.map((source) =>
    renderSource(
      source,
      md,
      config,
      languages,
      layouts,
      componentScriptAssets,
      layoutScriptAssets,
      llmsConfig,
      footerScript
    )
  );
  await buildRuntime(publicDir, {
    config,
    languages,
    menuItems,
    sidebarItems,
    sharedVpModules: pageSharedVpModules(pages),
  });
  if (isSearchEnabled(config)) await writeSearchIndex(publicDir, pages);
  if (isSitemapEnabled(config)) await writeSitemap(outputDir, pages, config);
  if (isLlmsEnabled(config)) {
    await writeLlms(outputDir, pages, config, llmsConfig);
  }
  if (isRobotsEnabled(config)) {
    await writeRobots(outputDir, await loadRobotsConfig(configDir));
  }
  await writePageScripts(outputDir, pages);

  for (const page of pages) {
    const outputFile = path.join(outputDir, page.rel);
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, page.html, 'utf8');
    console.warn(`built: ${toPosix(path.relative(workingRoot, outputFile))}`);
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
    `done: ${pages.length} page(s), ${toPosix(path.relative(workingRoot, outputDir))}`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build({
    inputDir: resolveDir(workingRoot, process.argv[2], defaultInputDir),
    outputDir: resolveDir(workingRoot, process.argv[3], defaultOutputDir),
    assetsDir: defaultAssetsDir,
    configDir: defaultConfigDir,
    layoutsDir: defaultLayoutsDir,
    componentsDir: defaultComponentsDir,
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
