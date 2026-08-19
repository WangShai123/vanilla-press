import type {
  MarkdownEnv,
  MarkdownRendererRule,
  MarkdownRuntime,
} from '../utilities/markdown.ts'

const VP_SCRIPT_INFO = 'vp-script'

function isVpScriptInfo(info: unknown): boolean {
  const value = typeof info === 'string' ? info : ''
  return value.trim().split(/\s+/)[0] === VP_SCRIPT_INFO
}

function pushVpScript(env: MarkdownEnv | undefined, code: string): void {
  if (!env) return
  const value = code.trim()
  if (!value) return
  if (!env.vpScripts) env.vpScripts = []
  env.vpScripts.push(value)
}

export function installVpScript(md: MarkdownRuntime): void {
  const renderFence = md.renderer.rules.fence

  md.renderer.rules.fence = ((tokens, idx, options, env, self) => {
    const token = tokens[idx]
    if (isVpScriptInfo(token?.info)) {
      pushVpScript(env as MarkdownEnv | undefined, token.content)
      return ''
    }

    return renderFence
      ? renderFence(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)
  }) as MarkdownRendererRule
}
