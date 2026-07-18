import path from "path";

export function resolveDir(projectRoot, value, fallback) {
  return path.resolve(projectRoot, value || fallback);
}

export function toPosix(value) {
  return value.split(path.sep).join("/");
}

export function stripMdExt(file) {
  return file.replace(/\.md$/i, ".html");
}

export function normalizePath(value) {
  return String(value || "")
    .replace(/^\/+/, "")
    .replace(/\/+$/g, "");
}

export function relativeAsset(fromRel, assetRel) {
  const relative = path.posix.relative(path.posix.dirname(fromRel), assetRel);
  return relative.startsWith(".") ? relative : `./${relative}`;
}
