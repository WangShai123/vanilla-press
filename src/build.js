import createDOMPurify from "dompurify";
import fs from "fs/promises";
import { glob } from "glob";
import { JSDOM } from "jsdom";
import path from "path";
import { fileURLToPath } from "url";
import { build as viteBuild } from "vite";
import md from "./core/md.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const defaultInputDir = path.join(projectRoot, "docs");
const defaultOutputDir = path.join(projectRoot, "dist");
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

function resolveDir(value, fallback) {
  return path.resolve(projectRoot, value || fallback);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function stripMdExt(file) {
  return file.replace(/\.md$/i, ".html");
}

function pageTitle(markdown, file) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || path.basename(file, ".md");
}

function cleanHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "a",
      "blockquote",
      "br",
      "button",
      "code",
      "del",
      "div",
      "em",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      "img",
      "li",
      "ol",
      "p",
      "pre",
      "span",
      "strong",
      "table",
      "tbody",
      "td",
      "th",
      "thead",
      "tr",
      "ul",
    ],
    ALLOWED_ATTR: [
      "alt",
      "aria-expanded",
      "class",
      "data-component",
      "data-direction",
      "data-doc-accordion-item",
      "data-doc-component",
      "data-doc-offcanvas-content",
      "data-doc-offcanvas-trigger",
      "data-doc-tab",
      "data-title",
      "hidden",
      "href",
      "id",
      "rel",
      "src",
      "target",
      "type",
    ],
    ALLOW_DATA_ATTR: true,
  });
}

function relativeAsset(fromRel, assetRel) {
  const relative = path.posix.relative(path.posix.dirname(fromRel), assetRel);
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function renderNav(pages, currentRel) {
  return pages
    .map((page) => {
      const href = relativeAsset(currentRel, page.rel);
      const active = page.rel === currentRel ? " is-active" : "";
      return `<a class="doc-nav-link${active}" href="${href}">${page.title}</a>`;
    })
    .join("\n");
}

function renderHtml({ title, body, pages, rel, components }) {
  const cssHref = relativeAsset(rel, "styles.css");
  const runtimeHref = relativeAsset(rel, "runtime.js");
  const nav = renderNav(pages, rel);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="${cssHref}">
</head>
<body>
  <div class="doc-shell">
    <aside class="doc-sidebar">
      <a class="doc-brand" href="${relativeAsset(rel, "index.html")}">Docs</a>
      <nav class="doc-nav" aria-label="文档导航">
        ${nav}
      </nav>
    </aside>
    <main class="doc-main">
      <article class="j-content is-sm">
        ${body}
      </article>
    </main>
  </div>
  <script type="module">
    import { initDocPage } from '${runtimeHref}';
    initDocPage({ components: ${JSON.stringify(components)} });
  </script>
</body>
</html>
`;
}

async function buildCss(outputDir) {
  const juiCssUrl = await import.meta.resolve("vanilla-jui/style.css");
  const juiCss = await fs.readFile(fileURLToPath(juiCssUrl), "utf8");
  const customCss = await fs.readFile(path.join(projectRoot, "src/style.css"), "utf8");

  await fs.writeFile(path.join(outputDir, "styles.css"), `${juiCss}\n\n${customCss}`, "utf8");
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

export async function build({ inputDir = defaultInputDir, outputDir = defaultOutputDir } = {}) {
  await fs.rm(outputDir, { force: true, recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  const files = (
    await glob("**/*.md", {
      cwd: inputDir,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort();

  const sources = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(inputDir, file);
      const markdown = await fs.readFile(fullPath, "utf8");
      return {
        file,
        fullPath,
        markdown,
        rel: toPosix(stripMdExt(file)),
        title: pageTitle(markdown, file),
      };
    }),
  );

  await buildCss(outputDir);
  await buildRuntime(outputDir);

  for (const source of sources) {
    const env = { file: source.file, components: new Set() };
    const rendered = md.render(source.markdown, env);
    const body = cleanHtml(rendered);
    const components = Array.from(env.components).sort();
    const html = renderHtml({
      title: source.title,
      body,
      pages: sources,
      rel: source.rel,
      components,
    });
    const outputFile = path.join(outputDir, source.rel);

    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, html, "utf8");
    console.log(`built ${toPosix(path.relative(projectRoot, outputFile))}`);
  }

  console.log(`done: ${sources.length} page(s), ${toPosix(path.relative(projectRoot, outputDir))}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build({
    inputDir: resolveDir(process.argv[2], defaultInputDir),
    outputDir: resolveDir(process.argv[3], defaultOutputDir),
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
