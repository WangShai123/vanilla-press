import type {
  MarkdownEnv,
  MarkdownRendererRule,
  MarkdownRuntime,
} from '../utilities/markdown.ts';

const INLINE_SCRIPT_INFO = 'vp-script';

function isInlineScriptInfo(info: unknown): boolean {
  const value = typeof info === 'string' ? info : '';
  return value.trim().split(/\s+/)[0] === INLINE_SCRIPT_INFO;
}

function pushInlineScript(env: MarkdownEnv | undefined, code: string): void {
  if (!env) return;
  const value = code.trim();
  if (!value) return;
  if (!env.inlineScripts) env.inlineScripts = [];
  env.inlineScripts.push(value);
}

export function installInlineScript(md: MarkdownRuntime): void {
  const renderFence = md.renderer.rules.fence;

  md.renderer.rules.fence = ((tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (isInlineScriptInfo(token?.info)) {
      pushInlineScript(env as MarkdownEnv | undefined, token.content);
      return '';
    }

    return renderFence
      ? renderFence(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options);
  }) as MarkdownRendererRule;
}
