import { transform as esbuildTransform } from "esbuild";
import fs from "fs/promises";
import { glob } from "glob";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { build as viteBuild } from "vite";
import { randomId } from "vanilla-jui";
import {
  DEFAULT_CONFIG_JS,
  DEFAULT_LANGUAGES_JS,
  DEFAULT_MENU_JS,
  DEFAULT_SIDEBAR_JS,
} from "./config/defaults.js";
import { createMarkdown } from "./core/md.js";
import { layoutStyles, loadLayouts, renderLayout } from "./render/layout.js";
import { renderDefaultLocaleEntrypoint, renderHtml } from "./render/html.js";
import {
  isI18nEnabled,
  isMenuEnabled,
  isSitemapEnabled,
  isSearchEnabled,
  isSeoEnabled,
  isSidebarEnabled,
  isThemeEnabled,
  runtimeOption,
  isTocEnabled,
} from "./utilities/features.js";
import { parseFrontmatter, pickSeoFrontmatter } from "./utilities/frontmatter.js";
import { cleanHtml, htmlText } from "./utilities/html.js";
import { excerptText, pageTitle } from "./utilities/page.js";
import { normalizePath, resolveDir, stripMdExt, toPosix } from "./utilities/path.js";
import { minifyCss, readStyleConfig } from "./utilities/style.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const defaultInputDir = path.join(projectRoot, "docs");
const defaultOutputDir = path.join(projectRoot, "dist");

async function pathExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function ensureSourceConfig(inputDir) {
  const files = [
    ["config.js", DEFAULT_CONFIG_JS],
    ["languages.js", DEFAULT_LANGUAGES_JS],
    ["menu.js", DEFAULT_MENU_JS],
    ["sidebar.js", DEFAULT_SIDEBAR_JS],
  ];

  for (const [name, content] of files) {
    const file = path.join(inputDir, name);
    if (!(await pathExists(file))) {
      await fs.writeFile(file, content, "utf8");
    }
  }
}

async function copyRuntimeConfig(inputDir, outputDir, config = {}) {
  const files = ["config.js"];
  if (isI18nEnabled(config)) files.push("languages.js");
  if (isMenuEnabled(config)) files.push("menu.js");
  if (isSidebarEnabled(config)) files.push("sidebar.js");

  await Promise.all(
    files.map((file) => fs.copyFile(path.join(inputDir, file), path.join(outputDir, file))),
  );
}

async function loadDocConfig(inputDir) {
  const file = path.join(inputDir, "config.js");
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  return mod.docConfig || {};
}

function validateDocConfig(config = {}) {
  const siteUrl = String(config.siteUrl || "").trim();

  if (!siteUrl) {
    throw new Error(
      'docConfig.siteUrl is required. Add siteUrl: "https://your-domain.com" to docs/config.js.',
    );
  }

  let url;
  try {
    url = new URL(siteUrl);
  } catch {
    throw new Error(
      'docConfig.siteUrl must be an absolute URL, for example: "https://example.com".',
    );
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(
      'docConfig.siteUrl must be an http(s) URL, for example: "https://example.com".',
    );
  }
}

async function loadLanguages(inputDir) {
  const file = path.join(inputDir, "languages.js");
  if (!(await pathExists(file))) return {};

  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  return mod.languages || {};
}

function resolveDefaultLocale(config = {}, languages = {}) {
  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  if (!locales.length) return null;

  const i18n = runtimeOption(config, "i18n");
  const preferred = String(i18n?.defaultLocale || languages.locale || "")
    .trim()
    .toLowerCase();
  return (
    locales.find(
      (locale) =>
        String(locale.code || "")
          .trim()
          .toLowerCase() === preferred,
    ) || locales[0]
  );
}

async function writeDefaultLocaleEntrypoint(outputDir, config = {}, languages = {}, pages = []) {
  if (!isI18nEnabled(config)) return;
  const i18n = runtimeOption(config, "i18n");
  if (i18n?.redirectToDefault === false) return;

  const locale = resolveDefaultLocale(config, languages);
  const prefix = normalizePath(locale?.path);
  if (!prefix) return;

  const target = `${prefix}/index.html`;
  const hasTarget = pages.some((page) => page.rel === target);
  if (!hasTarget) return;

  const rootIndexFile = path.join(outputDir, "index.html");
  const rootLang =
    String(locale?.code || i18n?.defaultLocale || languages.locale || "en").trim() || "en";
  const html = renderDefaultLocaleEntrypoint(target, rootLang);

  await fs.writeFile(rootIndexFile, html, "utf8");
  console.log(`built ${toPosix(path.relative(projectRoot, rootIndexFile))}`);
}

async function buildCss(outputDir, layouts) {
  const configuredCss = await readStyleConfig(path.join(projectRoot, "src/config/style.js"));
  const customCss = await fs.readFile(path.join(projectRoot, "src/style.css"), "utf8");
  const styles = [...configuredCss, customCss, ...layoutStyles(layouts)];
  const css = await minifyCss(styles.join("\n\n"));

  await fs.writeFile(path.join(outputDir, "styles.css"), css, "utf8");
}

async function buildRuntime(outputDir) {
  await viteBuild({
    configFile: false,
    root: projectRoot,
    publicDir: false,
    logLevel: "warn",
    build: {
      emptyOutDir: false,
      minify: "oxc",
      outDir: outputDir,
      sourcemap: false,
      target: "es2020",
      lib: {
        entry: path.join(projectRoot, "src/runtime.js"),
        formats: ["es"],
        fileName: () => "runtime.js",
      },
      rollupOptions: {
        output: {
          assetFileNames: "assets/[name][extname]",
          chunkFileNames: "assets/[name]-[hash].js",
        },
      },
    },
  });
}

function hashFileName(fileName) {
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);
  return `${baseName}.${randomId(8)}${ext}`;
}

function rewriteAssetReferences(html, assetMap = new Map()) {
  let output = html;

  for (const [from, to] of assetMap) {
    const pattern = new RegExp(`(["'])([^"']*?)${from}(["'])`, "g");
    output = output.replaceAll(pattern, `$1$2${to}$3`);
  }

  return output;
}

async function hashRootAssets(outputDir) {
  const assetFiles = [
    "styles.css",
    "runtime.js",
    "search-index.js",
    "config.js",
    "languages.js",
    "menu.js",
    "sidebar.js",
  ];

  const assetMap = new Map();

  for (const file of assetFiles) {
    const fullPath = path.join(outputDir, file);
    if (!(await pathExists(fullPath))) continue;

    const hashedFile = hashFileName(file);
    await fs.rename(fullPath, path.join(outputDir, hashedFile));
    assetMap.set(file, hashedFile);
  }

  return assetMap;
}

async function rewriteHtmlAssets(outputDir, assetMap = new Map()) {
  const files = (
    await glob("**/*.html", {
      cwd: outputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort();

  await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(outputDir, file);
      const html = await fs.readFile(fullPath, "utf8");
      const next = rewriteAssetReferences(html, assetMap);
      if (next !== html) {
        await fs.writeFile(fullPath, next, "utf8");
      }
    }),
  );
}

async function minifyJsAssets(outputDir) {
  const files = (
    await glob("**/*.js", {
      cwd: outputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort();

  await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(outputDir, file);
      const code = await fs.readFile(fullPath, "utf8");
      const result = await esbuildTransform(code, {
        format: "esm",
        legalComments: "none",
        loader: "js",
        minify: true,
        target: "es2020",
      });

      await fs.writeFile(fullPath, result.code.trim(), "utf8");
    }),
  );

  console.log(`minified js: ${files.length} file(s)`);
}

function readSource(file, markdown) {
  const frontmatter = parseFrontmatter(markdown);

  return {
    file,
    markdown,
    frontmatter,
    seo: pickSeoFrontmatter(frontmatter),
    rel: toPosix(stripMdExt(file)),
    title: pageTitle(markdown, file),
  };
}

function renderSource(source, md, config, languages, layouts) {
  const env = { file: source.file, components: new Set(), config };
  const rendered = md.render(source.markdown, env);
  const body = cleanHtml(rendered);
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
    },
    layouts,
  });

  return {
    ...source,
    body,
    content: htmlText(body),
    components: Array.from(env.components).sort(),
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
    }),
  };
}

function createSearchIndex(pages = []) {
  return pages.map((page) => ({
    title: page.seo?.title || page.title,
    rel: page.rel,
    keywords: page.seo?.keywords || "",
    description: page.seo?.description || "",
    excerpt: excerptText(page.seo?.description || page.content),
    content: page.content,
  }));
}

async function writeSearchIndex(outputDir, pages = []) {
  const code = `export const searchIndex = ${JSON.stringify(createSearchIndex(pages))};\n`;
  await fs.writeFile(path.join(outputDir, "search-index.js"), code, "utf8");
}

function siteUrl(config = {}) {
  return String(config.siteUrl || "")
    .trim()
    .replace(/\/+$/g, "");
}

function sitemapLoc(page, baseUrl) {
  const rel = toPosix(page.rel).replace(/^\/+/, "");
  const encodedRel = rel.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/${encodedRel}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function writeSitemap(outputDir, pages = [], config = {}) {
  const baseUrl = siteUrl(config);
  const urls = pages
    .map((page) => `  <url>\n    <loc>${escapeXml(sitemapLoc(page, baseUrl))}</loc>\n  </url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  await fs.writeFile(path.join(outputDir, "sitemap.xml"), xml, "utf8");
}

export async function build({ inputDir = defaultInputDir, outputDir = defaultOutputDir } = {}) {
  if (path.resolve(inputDir) === path.resolve(outputDir)) {
    throw new Error("inputDir and outputDir must be different directories.");
  }

  await fs.mkdir(inputDir, { recursive: true });
  await ensureSourceConfig(inputDir);
  const config = await loadDocConfig(inputDir);
  validateDocConfig(config);
  const md = createMarkdown(config);
  const layouts = await loadLayouts({ projectRoot, inputDir });

  await fs.rm(outputDir, { force: true, recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  await copyRuntimeConfig(inputDir, outputDir, config);
  const languages = isI18nEnabled(config) ? await loadLanguages(inputDir) : {};
  const files = (
    await glob("**/*.md", {
      cwd: inputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort();
  const sources = await Promise.all(
    files.map(async (file) =>
      readSource(file, await fs.readFile(path.join(inputDir, file), "utf8")),
    ),
  );

  await buildCss(outputDir, layouts);
  await buildRuntime(outputDir);

  const pages = sources.map((source) => renderSource(source, md, config, languages, layouts));
  if (isSearchEnabled(config)) await writeSearchIndex(outputDir, pages);
  if (isSitemapEnabled(config)) await writeSitemap(outputDir, pages, config);

  for (const page of pages) {
    const outputFile = path.join(outputDir, page.rel);
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, page.html, "utf8");
    console.log(`built ${toPosix(path.relative(projectRoot, outputFile))}`);
  }

  await writeDefaultLocaleEntrypoint(outputDir, config, languages, pages);
  await minifyJsAssets(outputDir);
  const assetMap = await hashRootAssets(outputDir);
  await rewriteHtmlAssets(outputDir, assetMap);

  console.log(`done: ${pages.length} page(s), ${toPosix(path.relative(projectRoot, outputDir))}`);
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
