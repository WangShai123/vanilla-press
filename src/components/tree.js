import { getRegistedIconPath, icon } from "vanilla-jui";
import { escapeAttr, markComponent, readContainer } from "../utilities/markdown.js";

let globalTreeEventsReady = false;
let activeTreeIcons = null;

function escapeHtml(value) {
  return escapeAttr(value);
}

function parseTreeLine(line) {
  const connector = line.match(/^([│ ]*)(?:├──|└──)\s*(.+)$/u);

  if (connector) {
    return {
      depth: treeDepth(connector[1]),
      name: connector[2].trim(),
    };
  }

  const plain = line.trim();
  return plain ? { depth: 0, name: plain } : null;
}

function treeDepth(prefix = "") {
  const pipes = prefix.match(/│/gu)?.length || 0;
  if (pipes) return pipes + 1;
  return Math.floor(prefix.length / 4) + 1;
}

function fileExtension(name) {
  const clean = String(name || "").replace(/\/+$/g, "");
  const index = clean.lastIndexOf(".");
  if (index <= 0 || index === clean.length - 1) return "";
  return clean.slice(index + 1).toLowerCase();
}

function parseNodeName(value) {
  const raw = String(value || "");
  const collapsed = /\s*\[collapsed]\s*$/i.test(raw);
  const name = raw.replace(/\s*\[collapsed]\s*$/i, "").trim();
  const directory = /\/\s*$/.test(name);

  return {
    name,
    directory,
    collapsed: directory && collapsed,
  };
}

function createTreeNode(value) {
  const parsed = parseNodeName(value);

  return {
    name: parsed.name,
    type: parsed.directory ? "directory" : "file",
    ext: parsed.directory ? "" : fileExtension(parsed.name),
    collapsed: parsed.collapsed,
    children: [],
  };
}

function parseTree(content = "") {
  const roots = [];
  const stack = [];

  for (const line of String(content).replace(/\s+$/g, "").split("\n")) {
    const parsed = parseTreeLine(line);
    if (!parsed) continue;

    const node = createTreeNode(parsed.name);
    const parent = parsed.depth > 0 ? stack[parsed.depth - 1] : null;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }

    stack[parsed.depth] = node;
    stack.length = parsed.depth + 1;
  }

  return roots;
}

function renderTreeNodes(nodes = [], hidden = false) {
  if (!nodes.length) return "";

  return `<ul class="j-tree-list"${hidden ? " hidden" : ""}>${nodes.map(renderTreeNode).join("")}</ul>`;
}

function renderTreeNode(node) {
  const directory = node.type === "directory";
  const collapsible = directory && node.children.length > 0;
  const attrs = [
    `class="j-tree-item is-${node.type}${node.collapsed ? " is-collapsed" : ""}"`,
    `data-tree-type="${node.type}"`,
    node.collapsed ? 'data-tree-collapsed="true"' : "",
    node.ext ? `data-tree-ext="${escapeAttr(node.ext)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const nodeAttrs = [
    'class="j-tree-node"',
    collapsible ? 'role="button"' : "",
    collapsible ? 'tabindex="0"' : "",
    collapsible ? `aria-expanded="${String(!node.collapsed)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `<li ${attrs}>
  <div ${nodeAttrs}>
    <span class="j-tree-icon" data-tree-icon aria-hidden="true"></span>
    <span class="j-tree-label">${escapeHtml(node.name)}</span>
  </div>
  ${renderTreeNodes(node.children, node.collapsed)}
</li>`;
}

export function installTree(md) {
  md.block.ruler.before("fence", "doc_tree", (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const end = state.eMarks[startLine];
    const line = state.src.slice(start, end);
    const match = line.match(/^:::tree(?:\s+(.*))?$/);

    if (!match) return false;
    if (silent) return true;

    const token = state.push("doc_tree", "div", 0);
    const block = readContainer(state, startLine, endLine);
    token.block = true;
    token.content = block.content;
    token.info = match[1] || "";
    state.line = block.nextLine;
    return true;
  });

  md.renderer.rules.doc_tree = (tokens, idx, _options, env) => {
    const content = tokens[idx].content;

    markComponent(env, "tree");

    return `<div class="doc-component j-tree" data-doc-component="tree">${renderTreeNodes(parseTree(content))}</div>`;
  };
}

function iconExists(name, icons) {
  return Boolean(name && icons[name]);
}

function directChild(item, selector) {
  return Array.from(item.children).find((child) => child.matches(selector)) || null;
}

function directTreeList(item) {
  return directChild(item, ".j-tree-list");
}

function directTreeNode(item) {
  return directChild(item, ".j-tree-node");
}

function directTreeIcon(item) {
  return directTreeNode(item)?.querySelector("[data-tree-icon]") || null;
}

function hasChildren(item) {
  return Boolean(directTreeList(item));
}

function isCollapsed(item) {
  return item.classList.contains("is-collapsed");
}

function resolveTreeIcon(item, icons) {
  const type = item.dataset.treeType || "file";
  if (type === "directory") {
    const folder = hasChildren(item) && !isCollapsed(item) ? "folder-open" : "folder";
    return [folder, "file"].find((name) => iconExists(name, icons)) || "file";
  }

  const ext = String(item.dataset.treeExt || "").trim().toLowerCase();
  const candidates = [ext, ext ? `file-${ext}` : "", "file"];
  return candidates.find((name) => iconExists(name, icons)) || "file";
}

function renderTreeIcon(target, item, icons) {
  target.textContent = "";
  target.append(icon(resolveTreeIcon(item, icons), { className: "el-icon" }));
}

function setDirectoryState(item, collapsed, icons) {
  const children = directTreeList(item);
  const node = directTreeNode(item);
  const target = directTreeIcon(item);

  item.classList.toggle("is-collapsed", collapsed);
  if (children) children.hidden = collapsed;
  if (node?.hasAttribute("aria-expanded")) {
    node.setAttribute("aria-expanded", String(!collapsed));
  }
  if (target) renderTreeIcon(target, item, icons);
}

function bindDirectoryToggle(item, icons) {
  const children = directTreeList(item);
  const node = directTreeNode(item);
  if (!children || !node) return;

  const collapsed = item.dataset.treeCollapsed === "true";
  node.setAttribute("role", "button");
  node.tabIndex = 0;
  setDirectoryState(item, collapsed, icons);

  if (node.dataset.treeToggleReady === "true") return;

  node.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleDirectoryNode(node, icons);
  });
  node.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    if (!toggleDirectoryNode(node, icons)) return;

    event.preventDefault();
    event.stopPropagation();
  });
  node.dataset.treeToggleReady = "true";
}

function toggleDirectoryNode(node, icons) {
  const item = node?.parentElement;
  if (!item || item.dataset.treeType !== "directory" || !hasChildren(item)) return false;

  setDirectoryState(item, !isCollapsed(item), icons);
  return true;
}

function toggleTreeEventTarget(target, event) {
  const node = target?.closest?.(".j-tree-node");
  const tree = node?.closest?.('[data-doc-component="tree"]');
  if (!node || !tree) return;

  const icons = activeTreeIcons || getRegistedIconPath();
  if (!toggleDirectoryNode(node, icons)) return;

  event.preventDefault();
  event.stopPropagation();
}

function bindGlobalTreeEvents() {
  if (globalTreeEventsReady || typeof document === "undefined") return;

  document.addEventListener("click", (event) => {
    toggleTreeEventTarget(event.target, event);
  });

  document.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    toggleTreeEventTarget(event.target, event);
  });

  globalTreeEventsReady = true;
}

function bindTreeEvents(container, icons) {
  if (container.dataset.treeEventsReady === "true") return;

  container.addEventListener("click", (event) => {
    const node = event.target.closest(".j-tree-node");
    if (!node || !container.contains(node)) return;
    toggleDirectoryNode(node, icons);
  });

  container.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;

    const node = event.target.closest(".j-tree-node");
    if (!node || !container.contains(node)) return;
    if (!toggleDirectoryNode(node, icons)) return;

    event.preventDefault();
  });

  container.dataset.treeEventsReady = "true";
}

export function initTree(root = document) {
  const icons = getRegistedIconPath();
  activeTreeIcons = icons;
  bindGlobalTreeEvents();

  root.querySelectorAll('[data-doc-component="tree"]').forEach((container) => {
    if (container.dataset.docReady === "true") return;

    container.querySelectorAll(".j-tree-item").forEach((item) => {
      const target = directTreeIcon(item);

      if (item.dataset.treeType === "directory") {
        if (hasChildren(item)) {
          bindDirectoryToggle(item, icons);
        } else if (target) {
          renderTreeIcon(target, item, icons);
        }
      } else if (target) {
        renderTreeIcon(target, item, icons);
      }
    });

    bindTreeEvents(container, icons);
    container.dataset.docReady = "true";
  });
}
