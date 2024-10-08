import type { WebsocketMessage } from "@socketless/shared";

type MaybePromise<T> = T | Promise<T>;

type OnMessageFunction<TResponse extends WebsocketMessage> = (
  message: TResponse,
) => MaybePromise<void>;

export class SocketlessWebsocket<
  TMessage extends WebsocketMessage = string,
  TResponse extends WebsocketMessage = string,
> {
  private url: string;
  private websocket!: WebSocket;
  private state: "STOPPED" | "DISCONNECTED" | "CONNECTING" | "CONNECTED" =
    "DISCONNECTED";

  private onMessage: OnMessageFunction<TResponse>;
  private sendQueue: TMessage[] = [];

  private readonly identifier = crypto.randomUUID();

  constructor(url: string, onMessage: OnMessageFunction<TResponse>) {
    this.url = url;
    this.onMessage = onMessage;

    this.createWebsocket();
  }

  private createWebsocket() {
    if (this.state !== "DISCONNECTED") {
      return;
    }

    const websocket = new WebSocket(this.url);
    this.state = "CONNECTING";

    websocket.onopen = () => {
      if (this.state === "STOPPED") {
        websocket.close();
        return;
      }

      this.state = "CONNECTED";

      // Send all messages in the queue
      for (const message of this.sendQueue) {
        websocket.send(JSON.stringify(message));
      }
    };

    websocket.onclose = () => {
      this.onDisconnect();
    };

    websocket.onerror = (err) => {
      console.error(err);

      this.onDisconnect();
    };

    websocket.onmessage = (message) => {
      if (typeof message.data !== "string") {
        // TODO: Handle binary messages
        return;
      }

      if (message.data === "") {
        // Empty frames are used for keep-alive
        websocket.send("");
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

  private onDisconnect() {
    if (this.state === "STOPPED") {
      return;
    }

    this.state = "DISCONNECTED";

    setTimeout(() => {
      if (this.state === "DISCONNECTED") {
        this.createWebsocket();
      }
    }, 500);
  }

  /**
   * Sends a message to the server.
   *
   * @param message The message to send
   * @param appendToQueue If true, the message will be added to the send queue if the socket is not connected, and sent when the socket connects.
   */
  send(message: TMessage, appendToQueue = true) {
    if (this.state === "STOPPED") {
      throw new Error("Socket is stopped");
    }

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

  /**
   * Closes the websocket connection. This instance cannot be used after calling this method.
   */
  close() {
    if (this.state === "STOPPED") {
      return;
    }

    this.state = "STOPPED";
    this.websocket.close();
  }

  updateUrl(url: string) {
    if (this.state === "STOPPED") {
      return;
    }

    if (this.url === url) {
      return;
    }

    this.url = url;
    this.websocket.close();
    // this.createWebsocket();
  }
}
