import { Drop, copy, icon } from "vanilla-jui";

const PROMPT = "I want to ask questions about it.";

function boolData(element, name) {
  return element?.dataset?.[name] === "true";
}

function promptQuery(mdUrl) {
  return ["read", mdUrl, ...PROMPT.split(" ")].map(encodeURIComponent).join("+");
}

function chatUrl(type, mdUrl) {
  const query = promptQuery(mdUrl);
  return type === "claude" ? `https://claude.ai/new?q=${query}` : `https://chatgpt.com/?q=${query}`;
}

function openBlank(url) {
  window.open(url, "_blank", "noopener");
}

function fillIcon(slot) {
  const name = slot?.dataset?.docLlmsIcon;
  if (!name) return;
  slot.replaceChildren(icon(name));
}

function label(container, key, fallback) {
  return container?.dataset?.[`docLlmsLabel${key}`] || fallback;
}

function actionIcon(action) {
  if (action === "copy") return icon("copy", { className: "el-prefix" });
  if (action === "chatgpt") return icon("openai", { className: "el-prefix" });
  if (action === "claude") return icon("anthropic", { className: "el-prefix" });
  return null;
}

function createDropItem(text, action) {
  const item = document.createElement("div");
  item.className = "llms-drop-item";
  item.tabIndex = 0;
  item.role = "button";
  item.dataset.llmsAction = action;
  const itemIcon = actionIcon(action);
  if (itemIcon) item.appendChild(itemIcon);
  item.appendChild(document.createTextNode(text));
  return item;
}

function createDropContent(container) {
  const items = [];

  if (boolData(container, "docLlmsCopy")) {
    items.push(createDropItem(label(container, "Copy", "复制 Markdown 链接"), "copy"));
  }

  if (boolData(container, "docLlmsChatgpt")) {
    items.push(createDropItem(label(container, "Chatgpt", "在 ChatGPT 中打开"), "chatgpt"));
  }

  if (boolData(container, "docLlmsClaude")) {
    items.push(createDropItem(label(container, "Claude", "在 Claude 中打开"), "claude"));
  }

  const root = document.createElement("div");
  root.className = "llms-drop-menu";
  root.append(...items);
  return root;
}

async function runAction(action, mdUrl) {
  if (action === "copy") {
    await copy(mdUrl);
    return;
  }

  if (action === "chatgpt" || action === "claude") {
    openBlank(chatUrl(action, mdUrl));
  }
}

function bindDrop(container, trigger, mdUrl) {
  const drop = new Drop(trigger, {
    className: "llms-drop",
    containerClassName: "llms-drop-container",
    content: createDropContent(container),
    mode: "click",
    position: "bottom-left",
    onShown: () => trigger.classList.add("is-active"),
    onHidden: () => trigger.classList.remove("is-active"),
  });

  drop.root.addEventListener("click", async (event) => {
    const item = event.target.closest("[data-llms-action]");
    if (!item) return;

    await runAction(item.dataset.llmsAction, mdUrl);
    drop.hide(false);
  });

  drop.root.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const item = event.target.closest("[data-llms-action]");
    if (!item) return;

    event.preventDefault();
    await runAction(item.dataset.llmsAction, mdUrl);
    drop.hide(false);
  });
}

function initContainer(container) {
  if (container.dataset.docLlmsReady === "true") return;
  const mdUrl = container.dataset.docLlmsMdUrl;
  if (!mdUrl) return;

  container.querySelectorAll("[data-doc-llms-icon]").forEach(fillIcon);

  const link = container.querySelector("[data-doc-llms-link]");
  link?.addEventListener("click", () => openBlank(mdUrl));

  const trigger = container.querySelector("[data-doc-llms-options-trigger]");
  if (trigger) {
    bindDrop(container, trigger, mdUrl);
  }

  container.dataset.docLlmsReady = "true";
}

export function initLlms() {
  document.querySelectorAll("[data-doc-llms]").forEach(initContainer);
}
