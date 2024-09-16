import { z } from "zod";

import type {
  ApiPostConnectRequestSchema,
  ApiPostFeedsRequestSchema,
  ApiPostMessageRequestSchema,
  WebhookFeedsManageResponseSchema,
  WebhookFeedsManageResponseType,
  WebhookMessageResponseSchema,
  WebhookResponseSchema,
} from "@socketless/shared";
import {
  ApiPostConnectResponseSchema,
  EWebhookActions,
} from "@socketless/shared";

import { constructWebhookPayload } from "../webhook";

type WebsocketMessage = string | Record<string, unknown> | unknown[];

interface BuildSend<TResponse extends WebsocketMessage> {
  toFeed: (feed: string) => SenderContext<TResponse>;
  toFeeds: (feeds: string[]) => SenderContext<TResponse>;
  toClient: (identifier: string) => SenderContext<TResponse>;
  toClients: (identifiers: string[]) => SenderContext<TResponse>;
}

class SenderContext<TResponse extends WebsocketMessage>
  implements BuildSend<TResponse>
{
  private feeds: string[] = [];
  private clients: string[] = [];
  private messages: z.infer<typeof WebhookMessageResponseSchema>[];

  constructor(messages: z.infer<typeof WebhookMessageResponseSchema>[]) {
    this.messages = messages;
  }

  toFeed(feed: string) {
    this.feeds.push(feed);

    return this;
  }

  toFeeds(feeds: string[]) {
    this.feeds.push(...feeds);

    return this;
  }

  toClient(identifier: string) {
    this.clients.push(identifier);

    return this;
  }

  toClients(identifiers: string[]) {
    this.clients.push(...identifiers);

    return this;
  }

  send(message: TResponse): void {
    this.messages.push({
      message,
      clients: this.clients,
      feeds: this.feeds,
    });
  }
}

type SocketlessContext<TResponse extends WebsocketMessage> =
  BuildSend<TResponse> & {
    send: (
      message: TResponse,
      receivers: { identifiers?: string | string[]; feeds?: string | string[] },
    ) => void;
    buildResponse: () => z.infer<typeof WebhookResponseSchema>;
    /**
     * @param feed Feed to join
     * @param clients Clients to join the feed. If undefined, the current client will be joined.
     */
    joinFeed: (feed: string, clients?: string | string[]) => void;
    /**
     * @param feeds Feeds to join
     * @param clients Clients to join the feeds. If undefined, the current client will be joined.
     */
    joinFeeds: (feeds: string[], clients?: string | string[]) => void;
    /**
     * @param feed Feed to leave
     * @param clients Clients to leave the feed. If undefined, the current client will be left.
     */
    leaveFeed: (feed: string, clients?: string | string[]) => void;
    /**
     * @param feeds Feeds to leave
     * @param clients Clients to leave the feeds. If undefined, the current client will be left.
     */
    leaveFeeds: (feeds: string[], clients?: string | string[]) => void;
  };

type PublicSocketlessContext<TResponse extends WebsocketMessage> = Omit<
  SocketlessContext<TResponse>,
  "buildResponse"
>;

function createContext<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
>(
  server: SocketlessServer<TMessage, TResponse>,
  identifier: string,
): SocketlessContext<TResponse> {
  const messagesToSend: z.infer<typeof WebhookMessageResponseSchema>[] = [];
  const feedsToManage: z.infer<typeof WebhookFeedsManageResponseSchema>[] = [];

  const formatClients = (clients: string | string[] | undefined) => {
    if (clients === undefined) {
      return identifier;
    }

    if (Array.isArray(clients)) {
      return clients;
    }

    return [clients];
  };

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

    // Socket.io like methods
    /**
     * Builder to send messages to clients or feeds
     */
    toClient(identifier) {
      const sendContext = new SenderContext<TResponse>(messagesToSend);

      return sendContext.toClient(identifier);
    },
    /**
     * Builder to send messages to clients or feeds
     */
    toClients(identifier: string[]) {
      const sendContext = new SenderContext<TResponse>(messagesToSend);

      return sendContext.toClients(identifier);
    },
    /**
     * Builder to send messages to clients or feeds
     */
    toFeed(feed: string) {
      const sendContext = new SenderContext<TResponse>(messagesToSend);

      return sendContext.toFeed(feed);
    },
    /**
     * Builder to send messages to clients or feeds
     */
    toFeeds(feeds: string[]) {
      const sendContext = new SenderContext<TResponse>(messagesToSend);

      return sendContext.toFeeds(feeds);
    },

    // Methods to manage feeds
    joinFeed(feed, clients) {
      feedsToManage.push({
        feeds: [feed],
        action: "join",
        clients: formatClients(clients),
      });
    },

    joinFeeds(feeds, clients) {
      feedsToManage.push({
        feeds,
        action: "join",
        clients: formatClients(clients),
      });
    },

    leaveFeed(feed, clients) {
      feedsToManage.push({
        feeds: [feed],
        action: "leave",
        clients: formatClients(clients),
      });
    },

    leaveFeeds(feeds, clients) {
      feedsToManage.push({
        feeds,
        action: "leave",
        clients: formatClients(clients),
      });
    },
  };
}

type MaybePromise<T> = T | Promise<T>;

type OnConnectFunc<TResponse extends WebsocketMessage> = (
  context: PublicSocketlessContext<TResponse>,
  identifier: string,
) => MaybePromise<void>;

type OnDisconnectFunc<TResponse extends WebsocketMessage> = (
  context: PublicSocketlessContext<TResponse>,
  identifier: string,
) => MaybePromise<void>;

type OnMessageFunc<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
> = (
  context: PublicSocketlessContext<TResponse>,
  identifier: string,
  message: TMessage,
) => MaybePromise<void>;

interface SocketlessServerOptions<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
> {
  clientId: string;
  token: string;

  /**
   * @default "https://app.socketless.ws/api/v0"
   */
  socketless_url?: string;

  /**
   * If undefined, the server will be created in the current domain using env.VERCAL_URL/api/socketless
   */
  url?: string;

  onConnect?: OnConnectFunc<TResponse>;
  onDisconnect?: OnDisconnectFunc<TResponse>;
  onMessage?: OnMessageFunc<TMessage, TResponse>;

  messageValidator?: z.ZodType<TMessage>;
}

class SocketlessServer<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
> {
  private options: SocketlessServerOptions<TMessage, TResponse>;
  private url?: string;
  private baseUrl = "https://app.socketless.ws/api/v0";

  constructor(options: SocketlessServerOptions<TMessage, TResponse>) {
    this.options = options;

    if (this.options.url === undefined) {
      if (process.env.VERCEL_URL !== undefined) {
        this.url = `https://${process.env.VERCEL_URL}/api/socketless`;
      }
    } else {
      this.url = this.options.url;
    }

    if (this.url !== undefined) {
      if (this.url.includes("localhost")) {
        console.warn(
          "You are using a localhost URL. Currently Socketless does not support localhost URLs, so you won't be able to receive messages from the server. More info on https://docs.socketless.ws/local-development",
        );
      } else {
        const parsedUrl = z.string().url().safeParse(this.options.url);
        if (parsedUrl.success) {
          this.url = this.options.url;
        }
      }
    }

    if (this.url === undefined) {
      console.error(
        "Socketless: You must specify a valid URL for the server. Automatic Webhook disabled.",
      );
    }

    // Checking socketless_url
    if (this.options.socketless_url !== undefined) {
      const parsedSocketlessURL = z
        .string()
        .url()
        .safeParse(this.options.socketless_url);

      if (!parsedSocketlessURL.success) {
        throw new Error("Invalid socketless_url");
      }

      this.baseUrl = this.options.socketless_url;
    }
  }

  public generateRoutes() {
    return {
      POST: this.POST.bind(this),
    };
  }

  private async POST(req: Request): Promise<Response> {
    const webhookPayload = await constructWebhookPayload(
      req,
      this.options.token,
    );

    const context = createContext<TMessage, TResponse>(
      this,
      webhookPayload.data.connection.identifier,
    );

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
            let message: TMessage;

            // First of all, if it's a string, try parsing it as JSON
            if (
              typeof webhookPayload.data.message === "string" &&
              (webhookPayload.data.message.startsWith("{") ||
                webhookPayload.data.message.startsWith("["))
            ) {
              // If JSON try parsing
              try {
                message = JSON.parse(
                  webhookPayload.data.message,
                ) as unknown as TMessage;
              } catch {
                // TODO: Would be cool to check before if TMessage is string...
                message = webhookPayload.data.message as TMessage;
              }
            } else {
              // TODO: Would be cool to check before if TMessage is string...
              message = webhookPayload.data.message as TMessage;
            }

            // Validating message
            if (this.options.messageValidator !== undefined) {
              // Using validator
              const safeParse =
                await this.options.messageValidator.safeParseAsync(message);

              // If unsuccessful, log and ignore
              if (!safeParse.success) {
                console.error(
                  "Invalid message received. Ignoring it...",
                  safeParse.error,
                );

                return new Response("Invalid message validation", {
                  status: 400,
                });
              }
            }

            await this.options.onMessage(
              context,
              webhookPayload.data.connection.identifier,
              message,
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
    const req = await fetch(`${this.baseUrl}/connection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.token}`,
      },
      body: JSON.stringify({
        identifier,
        webhook:
          this.url !== undefined
            ? {
                url: this.url,
                secret: this.options.token,
                options: {
                  sendOnConnect: this.options.onConnect !== undefined,
                  sendOnMessage: this.options.onMessage !== undefined,
                  sendOnDisconnect: this.options.onDisconnect !== undefined,
                },
              }
            : undefined,
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
    message: TResponse,
    receivers: { identifiers?: string | string[]; feeds?: string | string[] },
  ) {
    if (receivers.identifiers === undefined && receivers.feeds === undefined) {
      throw new Error("You must specify at least one of identifiers or feeds");
    }

    const messagePayload =
      typeof message === "string" ? message : JSON.stringify(message);

    const req = await fetch(`${this.baseUrl}/message`, {
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

  public async manageFeeds(
    actions: WebhookFeedsManageResponseType | WebhookFeedsManageResponseType[],
  ) {
    const req = await fetch(`${this.baseUrl}/feeds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.token}`,
      },
      body: JSON.stringify({
        actions,
      } satisfies z.infer<typeof ApiPostFeedsRequestSchema>),
    });

    if (!req.ok) {
      throw new Error(`Failed to send message ${req.status} ${req.statusText}`);
    }
  }
}

export function createSocketless<
  TMessage extends WebsocketMessage = string,
  TResponse extends WebsocketMessage = string,
>(options: SocketlessServerOptions<TMessage, TResponse>) {
  return new SocketlessServer<TMessage, TResponse>(options);
}
