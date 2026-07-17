import createDOMPurify from "dompurify";
import { transform as esbuildTransform } from "esbuild";
import fs from "fs/promises";
import { glob } from "glob";
import { JSDOM } from "jsdom";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { build as viteBuild } from "vite";
import md from "./core/md.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const defaultInputDir = path.join(projectRoot, "docs");
const defaultOutputDir = path.join(projectRoot, "dist");
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const DEFAULT_CONFIG_JS = `export const docConfig = {
  siteName: "Docs",
  i18n: {
    enabled: true,
    defaultLocale: "zh-CN",
    redirectToDefault: true
  },
  theme: {
    enabled: true,
    offcanvas: {
      direction: "right"
    }
  },
  footer: {
    text: "footer.text"
  }
};
`;

const DEFAULT_MENU_JS = `export const menuItems = [
  { label: "menu.home", href: "index.html" },
  {
    label: "menu.guide",
    children: [
      { label: "menu.components", href: "guide/components.html" },
      { label: "menu.api", href: "guide/api.html" }
    ]
  }
];
`;

const DEFAULT_LANGUAGES_JS = `export const languages = {
  locale: "zh-CN",
  fallbackLocale: "en",
  locales: [
    { code: "zh-CN", label: "简体中文", path: "zh" },
    { code: "en", label: "English", path: "en" }
  ],
  messages: {
    "zh-CN": {
      menu: {
        home: "首页",
        guide: "指南",
        components: "组件",
        api: "API"
      },
      sidebar: {
        home: "首页",
        components: "组件",
        api: "API"
      },
      footer: {
        text: "Built with markdown-it and vanilla-jui."
      },
      theme: {
        button: "主题"
      }
    },
    en: {
      menu: {
        home: "Home",
        guide: "Guide",
        components: "Components",
        api: "API"
      },
      sidebar: {
        home: "Home",
        components: "Components",
        api: "API"
      },
      footer: {
        text: "Built with markdown-it and vanilla-jui."
      },
      theme: {
        button: "Theme"
      }
    }
  }
};
`;

const DEFAULT_SIDEBAR_JS = `export const sidebarItems = [
  { label: "sidebar.home", href: "index.html" },
  { label: "sidebar.components", href: "guide/components.html" },
  { label: "sidebar.api", href: "guide/api.html" }
];
`;

const THEME_BOOT_SCRIPT =
  "(function(d,k){var v={mode:'dark',theme:'indigo',radius:'sm',shadow:'sm',font:'sm'},m=d.cookie.match(new RegExp('(?:^|; )'+k+'=([^;]*)')),o=v;if(m){try{o=Object.assign({},v,JSON.parse(m[1]));}catch(e){o=v;}}else{d.cookie=k+'='+JSON.stringify(v)+'; expires='+new Date(Date.now()+864e5).toUTCString()+'; path=/; sameSite=strict';}try{var r=o.mode==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):o.mode,h=d.documentElement;h.classList.add(r||'dark','j-theme-'+(o.theme||v.theme),'j-radius-'+(o.radius||v.radius),'j-shadow-'+(o.shadow||v.shadow),'j-font-'+(o.font||v.font));}catch(e){}})(document,'jui-theme');";

function isThemeEnabled(config = {}) {
  if (config.theme === false) return false;
  return config.theme?.enabled !== false;
}

function isI18nEnabled(config = {}) {
  return config.i18n?.enabled !== false;
}

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

function renderHtml({ title, body, pages, rel, components, config }) {
  const cssHref = relativeAsset(rel, "styles.css");
  const runtimeHref = relativeAsset(rel, "runtime.js");
  const configHref = relativeAsset(rel, "config.js");
  const languagesHref = relativeAsset(rel, "languages.js");
  const menuHref = relativeAsset(rel, "menu.js");
  const sidebarHref = relativeAsset(rel, "sidebar.js");
  const nav = renderNav(pages, rel);
  const themeEnabled = isThemeEnabled(config);
  const i18nEnabled = isI18nEnabled(config);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  ${themeEnabled ? `<script>${THEME_BOOT_SCRIPT}</script>` : ""}
  <link rel="stylesheet" href="${cssHref}">
</head>
<body>
  <header class="doc-header">
    <div class="doc-header-inner" data-doc-desktop-header>
      <a class="doc-brand" data-doc-brand href="${relativeAsset(rel, "index.html")}">Docs</a>
      <nav class="doc-menu" data-doc-menu aria-label="主菜单"></nav>
      <div class="doc-header-actions">
        <select class="doc-locale j-select" data-doc-locale aria-label="切换语言" id="doc-locale-desktop"></select>
        ${themeEnabled ? '<button class="doc-theme-button j-button is-outline" type="button" data-doc-theme hidden></button>' : ""}
      </div>
    </div>
    <div class="doc-mobile-header" data-doc-mobile-header hidden>
      <div class="doc-mobile-header-main">
        <button class="doc-mobile-icon-button j-button is-ghost is-icon" type="button" data-doc-mobile-menu aria-label="打开主菜单"></button>
        <a class="doc-brand" data-doc-brand href="${relativeAsset(rel, "index.html")}">Docs</a>
      </div>
      <div class="doc-mobile-header-actions">
        <select class="doc-locale j-select is-sm" data-doc-locale aria-label="切换语言" id="doc-locale-mobile"></select>
        ${themeEnabled ? '<button class="doc-theme-button doc-mobile-icon-button j-button is-ghost is-icon" type="button" data-doc-theme hidden aria-label="主题"></button>' : ""}
      </div>
    </div>
    <div class="doc-mobile-secondary" data-doc-mobile-secondary hidden>
      <button class="doc-mobile-secondary-button j-button is-ghost" type="button" data-doc-mobile-sidebar aria-label="打开文档导航"></button>
      <button class="doc-mobile-secondary-button j-button is-ghost" type="button" data-doc-mobile-toc aria-label="打开页面目录"></button>
    </div>
  </header>
  <main class="doc-shell">
    <aside class="doc-sidebar">
      <nav class="doc-nav" data-doc-sidebar aria-label="文档导航"></nav>
    </aside>
    <section class="doc-main">
      <article class="j-content is-sm">
        ${body}
      </article>
      <aside class="doc-aside">
        <div class="doc-toc" data-doc-toc aria-label="页面目录"></div>
        <div class="doc-aside-custom" data-doc-aside-custom></div>
      </aside>
    </section>
  </main>
  <footer class="doc-footer" data-doc-footer></footer>
  <script type="module">
    import { initDocPage } from '${runtimeHref}';
    import { docConfig } from '${configHref}';
    import { menuItems } from '${menuHref}';
    import { sidebarItems } from '${sidebarHref}';
    const languages = ${i18nEnabled ? `((await import('${languagesHref}')).languages || {})` : `{}`};
    initDocPage({
      components: ${JSON.stringify(components)},
      config: docConfig,
      languages,
      menu: menuItems,
      sidebar: sidebarItems,
      page: {
        title: ${JSON.stringify(title)},
        rel: ${JSON.stringify(rel)}
      }
    });
  </script>
</body>
</html>
`;
}

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

async function copyRuntimeConfig(inputDir, outputDir) {
  await Promise.all(
    ["config.js", "languages.js", "menu.js", "sidebar.js"].map((file) =>
      fs.copyFile(path.join(inputDir, file), path.join(outputDir, file)),
    ),
  );
}

async function loadDocConfig(inputDir) {
  const file = path.join(inputDir, "config.js");
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  return mod.docConfig || {};
}

async function loadLanguages(inputDir) {
  const file = path.join(inputDir, "languages.js");
  if (!(await pathExists(file))) return {};

  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  return mod.languages || {};
}

function normalizePath(value) {
  return String(value || "")
    .replace(/^\/+/, "")
    .replace(/\/+$/g, "");
}

function resolveDefaultLocale(config = {}, languages = {}) {
  const locales = Array.isArray(languages.locales) ? languages.locales : [];
  if (!locales.length) return null;

  const preferred = String(config.i18n?.defaultLocale || languages.locale || "")
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
  if (config.i18n?.redirectToDefault === false) return;

  const locale = resolveDefaultLocale(config, languages);
  const prefix = normalizePath(locale?.path);
  if (!prefix) return;

  const target = `${prefix}/index.html`;
  const hasTarget = pages.some((page) => page.rel === target);
  if (!hasTarget) return;

  const rootIndexFile = path.join(outputDir, "index.html");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0; url=./${target}">
</head>
<body>
  <script>
    (function () {
      var target = './${target}';
      var suffix = window.location.search + window.location.hash;
      window.location.replace(target + suffix);
    })();
  </script>
  <p>Redirecting to <a href="./${target}">./${target}</a> ...</p>
</body>
</html>
`;

  await fs.writeFile(rootIndexFile, html, "utf8");
  console.log(`built ${toPosix(path.relative(projectRoot, rootIndexFile))}`);
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

export async function build({ inputDir = defaultInputDir, outputDir = defaultOutputDir } = {}) {
  if (path.resolve(inputDir) === path.resolve(outputDir)) {
    throw new Error("inputDir and outputDir must be different directories.");
  }

  await fs.mkdir(inputDir, { recursive: true });
  await ensureSourceConfig(inputDir);
  await fs.rm(outputDir, { force: true, recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  await copyRuntimeConfig(inputDir, outputDir);
  const config = await loadDocConfig(inputDir);
  const languages = isI18nEnabled(config) ? await loadLanguages(inputDir) : {};

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
      config,
    });
    const outputFile = path.join(outputDir, source.rel);

    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, html, "utf8");
    console.log(`built ${toPosix(path.relative(projectRoot, outputFile))}`);
  }

  await writeDefaultLocaleEntrypoint(outputDir, config, languages, sources);
  await minifyJsAssets(outputDir);

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
