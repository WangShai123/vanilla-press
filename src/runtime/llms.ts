import { Drop, all, copy, icon, q } from 'vanilla-jui';
import { jsx } from 'vanilla-signal';

const PROMPT = 'I want to ask questions about it.';

type LlmsAction = 'copy' | 'chatgpt' | 'claude';
type ChatAction = Exclude<LlmsAction, 'copy'>;

function boolData(element: HTMLElement | null, name: string): boolean {
  return element?.dataset?.[name] === 'true';
}

function promptQuery(mdUrl: string): string {
  return ['read', mdUrl, ...PROMPT.split(' ')]
    .map(encodeURIComponent)
    .join('+');
}

function chatUrl(type: ChatAction, mdUrl: string): string {
  const query = promptQuery(mdUrl);
  return type === 'claude'
    ? `https://claude.ai/new?q=${query}`
    : `https://chatgpt.com/?q=${query}`;
}

function openBlank(url: string): void {
  window.open(url, '_blank', 'noopener');
}

function fillIcon(slot: HTMLElement): void {
  const name = slot?.dataset?.docLlmsIcon;
  if (!name) return;
  slot.replaceChildren(icon(name));
}

function label(container: HTMLElement, key: string, fallback: string): string {
  return container?.dataset?.[`docLlmsLabel${key}`] || fallback;
}

function actionIcon(action: LlmsAction): SVGElement | null {
  if (action === 'copy') return icon('copy', { className: 'el-prefix' });
  if (action === 'chatgpt') return icon('openai', { className: 'el-prefix' });
  if (action === 'claude') return icon('anthropic', { className: 'el-prefix' });
  return null;
}

function createDropItem(text: string, action: LlmsAction): HTMLElement {
  const itemIcon = actionIcon(action);
  return jsx('div', {
    className: 'llms-drop-item',
    tabIndex: 0,
    role: 'button',
    'data-llms-action': action,
    children: [itemIcon, text],
  });
}

function createDropContent(container: HTMLElement): HTMLElement {
  const items: Array<HTMLElement | null> = [];

  if (boolData(container, 'docLlmsCopy')) {
    items.push(
      createDropItem(label(container, 'Copy', '复制 Markdown 链接'), 'copy')
    );
  }

  if (boolData(container, 'docLlmsChatgpt')) {
    items.push(
      createDropItem(
        label(container, 'Chatgpt', '在 ChatGPT 中打开'),
        'chatgpt'
      )
    );
  }

  if (boolData(container, 'docLlmsClaude')) {
    items.push(
      createDropItem(label(container, 'Claude', '在 Claude 中打开'), 'claude')
    );
  }

  return jsx('div', {
    className: 'llms-drop-menu',
    children: items,
  });
}

async function runAction(
  action: string | undefined,
  mdUrl: string
): Promise<void> {
  if (action === 'copy') {
    await copy(mdUrl);
    return;
  }

  if (action === 'chatgpt' || action === 'claude') {
    openBlank(chatUrl(action, mdUrl));
  }
}

function bindDrop(
  container: HTMLElement,
  trigger: HTMLElement,
  mdUrl: string
): void {
  const drop = new Drop(trigger, {
    className: { root: 'j-drop llms-drop' },
    containerClassName: 'llms-drop-container',
    content: createDropContent(container),
    mode: 'click',
    position: 'bottom-left',
    onShown: () => trigger.classList.add('is-active'),
    onHidden: () => trigger.classList.remove('is-active'),
  });
  if (!drop.root) return;

  drop.root.addEventListener('click', async (event) => {
    if (!(event.target instanceof Element)) return;
    const item = event.target.closest<HTMLElement>('[data-llms-action]');
    if (!item) return;

    await runAction(item.dataset.llmsAction, mdUrl);
    drop.hide(false);
  });

  drop.root.addEventListener('keydown', async (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (!(event.target instanceof Element)) return;
    const item = event.target.closest<HTMLElement>('[data-llms-action]');
    if (!item) return;

    event.preventDefault();
    await runAction(item.dataset.llmsAction, mdUrl);
    drop.hide(false);
  });
}

function initContainer(container: HTMLElement): void {
  if (container.dataset.docLlmsReady === 'true') return;
  const mdUrl = container.dataset.docLlmsMdUrl;
  if (!mdUrl) return;

  all<HTMLElement>('[data-doc-llms-icon]', container).forEach(fillIcon);

  const link = q<HTMLElement>('[data-doc-llms-link]', container);
  link?.addEventListener('click', () => openBlank(mdUrl));

  const trigger = q<HTMLElement>('[data-doc-llms-options-trigger]', container);
  if (trigger) {
    bindDrop(container, trigger, mdUrl);
  }

  container.dataset.docLlmsReady = 'true';
}

export function initLlms(): void {
  all<HTMLElement>('[data-doc-llms]').forEach(initContainer);
}
