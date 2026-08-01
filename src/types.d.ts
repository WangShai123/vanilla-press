declare module '*.css' {
  const css: string;
  export default css;
}

declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string);
    window: Window & typeof globalThis;
  }
}

declare module 'vanilla-signal' {
  export type Accessor<T> = () => T;
  export type SignalChild =
    | Node
    | string
    | number
    | boolean
    | null
    | undefined
    | SignalChild[];

  export interface SignalProps extends Record<string, unknown> {
    children?: SignalChild;
    className?: string;
    style?: string | Partial<CSSStyleDeclaration> | Record<string, unknown>;
  }

  export function createEffect(effect: () => void): () => void;
  export function jsx(tag: string, props?: SignalProps | null): HTMLElement;
  export function jsx(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): HTMLElement;
}
