import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import { renderTemplate } from "./template/engine.js";
import { renderHeaderTemplates, renderSecondaryTemplate } from "./template/chrome.js";
import { createPageShellContext } from "./template/shell.js";

const defaultLayoutName = "default";

async function pathExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function assertLayoutName(name) {
  if (!/^[A-Za-z][\w-]*$/.test(name)) {
    throw new Error(`Invalid layout name "${name}". Layout names must match /^[A-Za-z][\\w-]*$/.`);
  }
}

async function readLayout(root, name, source) {
  assertLayoutName(name);

  const dir = path.join(root, name);
  const templateFile = path.join(dir, "template.html");
  if (!(await pathExists(templateFile))) return null;

  const styleFile = path.join(dir, "style.css");
  return {
    name,
    source,
    dir,
    template: await fs.readFile(templateFile, "utf8"),
    style: (await pathExists(styleFile)) ? await fs.readFile(styleFile, "utf8") : "",
  };
}

async function readLayoutRoot(root, source) {
  if (!(await pathExists(root))) return [];

  const files = (
    await glob("*/template.html", {
      cwd: root,
      nodir: true,
      windowsPathsNoEscape: true,
    })
  ).sort();

  return Promise.all(files.map((file) => readLayout(root, file.split("/")[0], source)));
}

export async function loadLayouts({ projectRoot, inputDir }) {
  const layouts = new Map();
  const roots = [
    { dir: path.join(projectRoot, "src/layouts"), source: "src" },
    { dir: path.join(inputDir, "layouts"), source: "docs" },
  ];

  for (const root of roots) {
    const entries = await readLayoutRoot(root.dir, root.source);
    for (const entry of entries) {
      if (entry) layouts.set(entry.name, entry);
    }
  }

  if (!layouts.has(defaultLayoutName)) {
    throw new Error('Missing required layout "default". Add src/layouts/default/template.html.');
  }

  return layouts;
}

export function layoutStyles(layouts = new Map()) {
  return Array.from(layouts.values())
    .map((layout) => layout.style.trim())
    .filter(Boolean);
}

export function pageLayoutName(frontmatter = {}) {
  const name = String(frontmatter.layout || defaultLayoutName).trim() || defaultLayoutName;
  assertLayoutName(name);
  return name;
}

function scopedLayoutData(frontmatter = {}, name = defaultLayoutName) {
  const scopes = frontmatter.layouts;
  if (scopes && typeof scopes === "object" && !Array.isArray(scopes) && scopes[name]) {
    return scopes[name];
  }

  const direct = frontmatter[name];
  if (direct && typeof direct === "object" && !Array.isArray(direct)) return direct;

  return {};
}

export function renderLayout({
  body,
  source,
  config,
  sidebarEnabled,
  tocEnabled,
  chrome,
  layouts,
}) {
  const name = pageLayoutName(source.frontmatter);
  const layout = layouts.get(name);
  if (!layout) {
    throw new Error(`Unknown layout "${name}" in ${source.file}. Add ${name}/template.html under src/layouts or docs/layouts.`);
  }

  const shellContext = createPageShellContext({
    config,
    sidebarEnabled,
    tocEnabled,
    header: renderHeaderTemplates(chrome),
    secondary: renderSecondaryTemplate(chrome),
  });
  const context = {
    ...shellContext,
    content: body,
    title: source.seo?.title || source.title,
    description: source.seo?.description || "",
    keywords: source.seo?.keywords || "",
    page: {
      title: source.title,
      rel: source.rel,
      frontmatter: source.frontmatter,
    },
    site: config,
    layout: scopedLayoutData(source.frontmatter, name),
    layouts: source.frontmatter.layouts || {},
  };

  return {
    name,
    html: renderTemplate(layout.template, context),
  };
}
