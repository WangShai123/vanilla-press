declare module '*.css' {
  const css: string
  export default css
}

declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string)
    window: Window & typeof globalThis
  }
}
