import { build as esbuildBuild, transform as esbuildTransform } from "esbuild";
import { createRequire } from "module";
import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);

function flattenStyles(styles = []) {
  if (!Array.isArray(styles)) return styles ? [styles] : [];

  return styles.flatMap((style) => flattenStyles(style));
}

function packageParts(specifier) {
  const parts = specifier.split("/");
  if (specifier.startsWith("@")) {
    return {
      name: parts.slice(0, 2).join("/"),
      subpath: parts.slice(2).join("/"),
    };
  }

  return {
    name: parts[0],
    subpath: parts.slice(1).join("/"),
  };
}

function stripImportQuery(specifier) {
  return String(specifier || "").replace(/[?#].*$/u, "");
}

function resolvePackageStyle(specifier) {
  const { name, subpath } = packageParts(specifier);

  if (subpath) {
    const packageJson = require.resolve(`${name}/package.json`);
    return path.join(path.dirname(packageJson), subpath);
  }

  return require.resolve(specifier);
}

function resolveCssImport(specifier, importer) {
  const cleanSpecifier = stripImportQuery(specifier);
  const baseDir = importer ? path.dirname(importer) : process.cwd();

  if (path.isAbsolute(cleanSpecifier)) return cleanSpecifier;
  if (cleanSpecifier.startsWith(".")) return path.resolve(baseDir, cleanSpecifier);

  return resolvePackageStyle(cleanSpecifier);
}

function cssTextPlugin() {
  return {
    name: "css-text",
    setup(build) {
      build.onResolve({ filter: /\.css([?#].*)?$/ }, (args) => ({
        path: resolveCssImport(args.path, args.importer),
      }));
      build.onLoad({ filter: /\.css$/ }, async (args) => ({
        contents: await fs.readFile(args.path, "utf8"),
        loader: "text",
      }));
    },
  };
}

async function importBundledStyleConfig(file) {
  const result = await esbuildBuild({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    logLevel: "silent",
    plugins: [cssTextPlugin()],
  });

  const code = result.outputFiles[0]?.text || "";
  const href = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  return import(href);
}

export async function readStyleConfig(file) {
  const mod = await importBundledStyleConfig(file);
  const styles = mod.default || mod.styles || mod.styleSources || [];

  if (!styles.length) {
    throw new Error(
      `Style config ${pathToFileURL(file).href} must export a CSS array as default, styles, or styleSources.`,
    );
  }

  return flattenStyles(styles).map((style) => String(style || "").trim()).filter(Boolean);
}

export async function minifyCss(css) {
  const result = await esbuildTransform(String(css || ""), {
    legalComments: "none",
    loader: "css",
    minify: true,
  });

  return result.code.trim();
}
