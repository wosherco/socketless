import type { WebsocketMessage } from "@socketless/shared";

type MaybePromise<T> = T | Promise<T>;

type OnMessageFunction<TResponse extends WebsocketMessage> = (
  message: TResponse,
) => MaybePromise<void>;

const PING_INTERVAL = 5000;

export class SocketlessWebsocket<
  TMessage extends WebsocketMessage = string,
  TResponse extends WebsocketMessage = string,
> {
  private url: string;
  private websocket!: WebSocket;
  private state: "DISCONNECTED" | "CONNECTING" | "CONNECTED" = "DISCONNECTED";

  private pongInterval: Timer | null = null;
  private lastPong: number = Date.now();
  private shouldRetryOnClose = true;

  private onMessage: OnMessageFunction<TResponse>;
  private sendQueue: TMessage[] = [];

  constructor(url: string, onMessage: OnMessageFunction<TResponse>) {
    this.url = url;
    this.onMessage = onMessage;

    this.createWebsocket();
  }

  private createWebsocket() {
    const websocket = new WebSocket(this.url);
    this.state = "CONNECTING";

    websocket.onopen = () => {
      this.state = "CONNECTED";

      // Starting interval for sending pings
      this.pongInterval = setInterval(() => {
        if (this.lastPong < Date.now() - PING_INTERVAL * 2) {
          // A pong hasn't been received in 2 intervals, close the connection and try to reconnect
          websocket.close(1010);
          return;
        }

        // This doesn't count as a message to Socketless
        websocket.ping();
      }, PING_INTERVAL);

      // Send all messages in the queue
      for (const message of this.sendQueue) {
        websocket.send(JSON.stringify(message));
      }
    };

    websocket.on("ping", () => {
      websocket.pong();
    });

    websocket.on("pong", () => {
      this.lastPong = Date.now();
    });

    websocket.onclose = () => {
      this.state = "DISCONNECTED";

      // Clear the interval
      if (this.pongInterval !== null) {
        clearInterval(this.pongInterval);
        this.pongInterval = null;
      }

      if (this.shouldRetryOnClose) {
        // Try to reconnect
        this.createWebsocket();
      }
    };

    websocket.onerror = () => {
      this.state = "DISCONNECTED";

      // Clear the interval
      if (this.pongInterval !== null) {
        clearInterval(this.pongInterval);
        this.pongInterval = null;
      }

      if (this.shouldRetryOnClose) {
        // Try to reconnect
        this.createWebsocket();
      }
    };

    websocket.onmessage = (message) => {
      if (typeof message.data !== "string") {
        // TODO: Handle binary messages
        return;
      }

      // Surely the server sends a correct message, right?
      try {
        const data = JSON.parse(message.data) as TResponse;
        void this.onMessage(data);
      } catch {
        void this.onMessage(message.data as TResponse);
        return;
      }
    };

    this.websocket = websocket;
  }

  /**
   * Sends a message to the server.
   *
   * @param message The message to send
   * @param appendToQueue If true, the message will be added to the send queue if the socket is not connected, and sent when the socket connects.
   */
  send(message: TMessage, appendToQueue = true) {
    if (this.state !== "CONNECTED") {
      if (appendToQueue) {
        this.sendQueue.push(message);
      } else {
        throw new Error("Socket is not connected");
      }
    }

    this.websocket.send(JSON.stringify(message));
  }

  getState() {
    return this.state;
  }

  raw() {
    return this.websocket;
  }

  close() {
    this.shouldRetryOnClose = false;
    this.websocket.close();
  }
}
