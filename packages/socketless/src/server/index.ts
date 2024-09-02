import type { z } from "zod";

import type { ApiPostConnectRequestSchema } from "@socketless/shared";
import { ApiPostConnectResponseSchema } from "@socketless/shared";

const BASE_URL = "https://socketless.ws/api/v0";

interface SocketlessContext {
  // TODO: Finish types
  message: () => void;
  roomAction: () => void;
  send: () => void;
}

type MaybePromise<T> = T | Promise<T>;

type OnConnectFunc = (
  context: SocketlessContext,
  identifier: string,
) => MaybePromise<void>;

type OnDisconnectFunc = (
  context: SocketlessContext,
  identifier: string,
) => MaybePromise<void>;

type OnMessageFunc<TMessage = string> = (
  context: SocketlessContext,
  message: TMessage,
) => MaybePromise<void>;

interface SocketlessServerOptions<TMessage = string> {
  clientId: string;
  token: string;

  /**
   * If undefined, the server will be created in the current domain using env.VERCAL_URL/api/socketless
   */
  url?: string;

  onConnect?: OnConnectFunc;
  onDisconnect?: OnDisconnectFunc;
  onMessage?: OnMessageFunc<TMessage>;
}

class SocketlessServer<TMessage = string> {
  private options: SocketlessServerOptions;
  private url: string;

  constructor(options: SocketlessServerOptions) {
    this.options = options;

    this.url = this.options.url ?? `${process.env.VERCEL_URL}/api/socketless`;
  }

  public POST(req: Request) {
    // TODO: Implement webhook stuff
  }

  public async getConnection(identifier: string) {
    const req = await fetch(`${BASE_URL}/connection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.token}`,
      },
      body: JSON.stringify({
        identifier,
        webhook: {
          url: this.url,
          secret: this.options.token,
          options: {
            sendOnConnect: this.options.onConnect !== undefined,
            sendOnMessage: this.options.onMessage !== undefined,
            sendOnDisconnect: this.options.onDisconnect !== undefined,
          },
        },
      } satisfies z.infer<typeof ApiPostConnectRequestSchema>),
    });

    if (!req.ok) {
      throw new Error("Failed to create connection");
    }

    const payload = ApiPostConnectResponseSchema.parse(await req.json());

    return payload;
  }
}

export function createSocketless<TMessage = string>(
  options: SocketlessServerOptions,
) {}
