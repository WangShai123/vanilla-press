import { Drop, all, copy, icon, q } from "vanilla-jui";
import { jsx } from "vanilla-signal";

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
  const itemIcon = actionIcon(action);
  return jsx("div", {
    className: "llms-drop-item",
    tabIndex: 0,
    role: "button",
    "data-llms-action": action,
    children: [itemIcon, text],
  });
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

  return jsx("div", {
    className: "llms-drop-menu",
    children: items,
  });
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

  all("[data-doc-llms-icon]", container).forEach(fillIcon);

  const link = q("[data-doc-llms-link]", container);
  link?.addEventListener("click", () => openBlank(mdUrl));

  const trigger = q("[data-doc-llms-options-trigger]", container);
  if (trigger) {
    bindDrop(container, trigger, mdUrl);
  }

  container.dataset.docLlmsReady = "true";
}

export function initLlms() {
  all("[data-doc-llms]").forEach(initContainer);
}
