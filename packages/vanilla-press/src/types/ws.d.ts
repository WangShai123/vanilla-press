declare module 'ws' {
  import type { IncomingMessage, Server } from 'http'
  import type { Duplex } from 'stream'

  export class WebSocket {
    static readonly OPEN: number
    readonly readyState: number
    send(data: string): void
    terminate(): void
  }

  export interface WebSocketServerOptions {
    server?: Server
    path?: string
  }

  export class WebSocketServer {
    readonly clients: Set<WebSocket>
    constructor(options?: WebSocketServerOptions)
    close(callback?: (error?: Error) => void): void
    handleUpgrade(
      request: IncomingMessage,
      socket: Duplex,
      head: Buffer,
      callback: (client: WebSocket, request: IncomingMessage) => void
    ): void
  }
}
