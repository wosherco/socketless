import type { z } from "zod";

import type {
  ApiPostConnectRequestSchema,
  ApiPostMessageRequestSchema,
  WebhookFeedsManageResponseSchema,
  WebhookMessageResponseSchema,
  WebhookResponseSchema,
} from "@socketless/shared";
import {
  ApiPostConnectResponseSchema,
  EWebhookActions,
} from "@socketless/shared";

import { constructWebhookPayload } from "../webhook";

const BASE_URL = "https://socketless.ws/api/v0";

interface SocketlessContext<TMessage = string> {
  // TODO: Finish types
  send: (
    message: TMessage,
    receivers: { identifiers?: string | string[]; feeds?: string | string[] },
  ) => void;
  buildResponse: () => z.infer<typeof WebhookResponseSchema>;
}

function createContext<TMessage>(
  server: SocketlessServer<TMessage>,
): SocketlessContext<TMessage> {
  const messagesToSend: z.infer<typeof WebhookMessageResponseSchema>[] = [];
  const feedsToManage: z.infer<typeof WebhookFeedsManageResponseSchema>[] = [];

  return {
    send(message, receivers) {
      messagesToSend.push({
        message,
        clients: receivers.identifiers,
        feeds: receivers.feeds,
      });
    },
    buildResponse: () => ({
      messages: messagesToSend,
      feeds: feedsToManage,
    }),
  };
}

type MaybePromise<T> = T | Promise<T>;

type OnConnectFunc<TMessage> = (
  context: SocketlessContext<TMessage>,
  identifier: string,
) => MaybePromise<void>;

type OnDisconnectFunc<TMessage> = (
  context: SocketlessContext<TMessage>,
  identifier: string,
) => MaybePromise<void>;

type OnMessageFunc<TMessage> = (
  context: SocketlessContext<TMessage>,
  identifier: string,
  message: TMessage,
) => MaybePromise<void>;

interface SocketlessServerOptions<TMessage = string> {
  clientId: string;
  token: string;

  /**
   * If undefined, the server will be created in the current domain using env.VERCAL_URL/api/socketless
   */
  url?: string;

  onConnect?: OnConnectFunc<TMessage>;
  onDisconnect?: OnDisconnectFunc<TMessage>;
  onMessage?: OnMessageFunc<TMessage>;
}

class SocketlessServer<TMessage = string> {
  private options: SocketlessServerOptions<TMessage>;
  private url: string;

  constructor(options: SocketlessServerOptions<TMessage>) {
    this.options = options;

    this.url = this.options.url ?? `${process.env.VERCEL_URL}/api/socketless`;
  }

  public async POST(req: Request): Promise<Response> {
    const webhookPayload = await constructWebhookPayload(
      req,
      this.options.token,
    );

    const context = createContext<TMessage>(this);

    switch (webhookPayload.action) {
      case EWebhookActions.CONNECTION_OPEN:
        {
          if (this.options.onConnect !== undefined) {
            await this.options.onConnect(
              context,
              webhookPayload.data.connection.identifier,
            );
          }
        }
        break;
      case EWebhookActions.MESSAGE:
        {
          if (this.options.onMessage !== undefined) {
            // Parsing message
            if (
              typeof webhookPayload.data.message === "string" &&
              webhookPayload.data.message.startsWith("{")
            ) {
              try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                webhookPayload.data.message = JSON.parse(
                  webhookPayload.data.message,
                );
              } catch {
                // Do nothing
              }
            }

            await this.options.onMessage(
              context,
              webhookPayload.data.connection.identifier,
              webhookPayload.data.message as TMessage,
            );
          }
        }
        break;
      case EWebhookActions.CONNECTION_CLOSE:
        {
          if (this.options.onDisconnect !== undefined) {
            await this.options.onDisconnect(
              context,
              webhookPayload.data.connection.identifier,
            );
          }
        }
        break;
    }

    return new Response(JSON.stringify(context.buildResponse()), {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.token}`,
      },
    });
  }

  public async getConnection(
    identifier: string,
    feeds?: string[],
    overrideFeeds = true,
  ) {
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
        feeds,
        overrideFeeds,
      } satisfies z.infer<typeof ApiPostConnectRequestSchema>),
    });

    if (!req.ok) {
      throw new Error(
        `Failed to create connection ${req.status} ${req.statusText}`,
      );
    }

    const payload = ApiPostConnectResponseSchema.parse(await req.json());

    return payload;
  }

  public async sendMessage(
    message: TMessage,
    receivers: { identifiers?: string | string[]; feeds?: string | string[] },
  ) {
    if (receivers.identifiers === undefined && receivers.feeds === undefined) {
      throw new Error("You must specify at least one of identifiers or feeds");
    }

    const messagePayload =
      typeof message === "string" ? message : JSON.stringify(message);

    const req = await fetch(`${BASE_URL}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.token}`,
      },
      body: JSON.stringify({
        messages: {
          message: messagePayload,
          clients: receivers.identifiers,
          feeds: receivers.feeds,
        },
      } satisfies z.infer<typeof ApiPostMessageRequestSchema>),
    });

    if (!req.ok) {
      throw new Error(`Failed to send message ${req.status} ${req.statusText}`);
    }
  }
}

export function createSocketless<TMessage = string>(
  options: SocketlessServerOptions<TMessage>,
) {
  return new SocketlessServer<TMessage>(options);
}
