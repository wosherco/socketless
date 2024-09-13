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

interface BuildSend<TMessage = string> {
  toFeed: (feed: string) => SenderContext<TMessage>;
  toFeeds: (feeds: string[]) => SenderContext<TMessage>;
  toClient: (identifier: string) => SenderContext<TMessage>;
  toClients: (identifiers: string[]) => SenderContext<TMessage>;
}

class SenderContext<TMessage = string> implements BuildSend<TMessage> {
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

  send(message: TMessage): void {
    this.messages.push({
      message,
      clients: this.clients,
      feeds: this.feeds,
    });
  }
}

type SocketlessContext<TMessage = string> = BuildSend<TMessage> & {
  // TODO: Finish types
  send: (
    message: TMessage,
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

type PublicSocketlessContext<TMessage = string> = Omit<
  SocketlessContext<TMessage>,
  "buildResponse"
>;

function createContext<TMessage>(
  server: SocketlessServer<TMessage>,
  identifier: string,
): SocketlessContext<TMessage> {
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
      const sendContext = new SenderContext<TMessage>(messagesToSend);

      return sendContext.toClient(identifier);
    },
    /**
     * Builder to send messages to clients or feeds
     */
    toClients(identifier: string[]) {
      const sendContext = new SenderContext<TMessage>(messagesToSend);

      return sendContext.toClients(identifier);
    },
    /**
     * Builder to send messages to clients or feeds
     */
    toFeed(feed: string) {
      const sendContext = new SenderContext<TMessage>(messagesToSend);

      return sendContext.toFeed(feed);
    },
    /**
     * Builder to send messages to clients or feeds
     */
    toFeeds(feeds: string[]) {
      const sendContext = new SenderContext<TMessage>(messagesToSend);

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

type OnConnectFunc<TMessage> = (
  context: PublicSocketlessContext<TMessage>,
  identifier: string,
) => MaybePromise<void>;

type OnDisconnectFunc<TMessage> = (
  context: PublicSocketlessContext<TMessage>,
  identifier: string,
) => MaybePromise<void>;

type OnMessageFunc<TMessage> = (
  context: PublicSocketlessContext<TMessage>,
  identifier: string,
  message: TMessage,
) => MaybePromise<void>;

interface SocketlessServerOptions<TMessage = string> {
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

  onConnect?: OnConnectFunc<TMessage>;
  onDisconnect?: OnDisconnectFunc<TMessage>;
  onMessage?: OnMessageFunc<TMessage>;
}

class SocketlessServer<TMessage = string> {
  private options: SocketlessServerOptions<TMessage>;
  private url?: string;
  private baseUrl = "https://app.socketless.ws/api/v0";

  constructor(options: SocketlessServerOptions<TMessage>) {
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

    const context = createContext<TMessage>(
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
    message: TMessage,
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

export function createSocketless<TMessage = string>(
  options: SocketlessServerOptions<TMessage>,
) {
  return new SocketlessServer<TMessage>(options);
}
