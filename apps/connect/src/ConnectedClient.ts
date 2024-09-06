import type { WSContext, WSEvents, WSMessageReceive } from "hono/ws";
import { z } from "@hono/zod-openapi";

import type { DBType } from "@socketless/db/client";
import type { RedisType } from "@socketless/redis/client";
import type {
  SimpleWebhook,
  WebhookPayloadType,
  WebhookResponseSchema,
} from "@socketless/shared";
import { processFeedActions, processMessages } from "@socketless/api/logic";
import { eq } from "@socketless/db";
import { projectWebhookTable } from "@socketless/db/schema";
import {
  getFeedChannelName,
  getMainChannelName,
  getWebhooksCacheName,
} from "@socketless/redis";
import { createRedisClient } from "@socketless/redis/client";
import { RedisMessageSchema } from "@socketless/redis/schemas";
import { EWebhookActions, SimpleWebhookSchema } from "@socketless/shared";

import type { UsageManager } from "./internal/usage";
import { sentryWrapper } from "./external/sentry";
import { LogsManager } from "./internal/logs";
import { sendWebhook } from "./webhook";

export class ConnectedClient {
  private closing = false;

  private db: DBType;
  private usageManager: UsageManager;
  private redis: RedisType;
  private redisSubscriber: RedisType;

  private projectId: number;
  private projectClientId: string;
  private identifier: string;
  private feeds: string[];
  private internalWebhook?: SimpleWebhook;

  private onOpenCallback?: () => void;
  private onCloseCallback?: () => void;

  private logger: LogsManager;

  constructor(
    db: DBType,
    usage: UsageManager,
    projectId: number,
    projectClientId: string,
    identifier: string,
    feeds: string[],
    internalWebhook?: SimpleWebhook,
    onOpenCallback?: () => void,
    onCloseCallback?: () => void,
  ) {
    this.db = db;
    this.usageManager = usage;
    this.redisSubscriber = createRedisClient();
    this.redis = createRedisClient();

    this.projectId = projectId;
    this.projectClientId = projectClientId;
    this.identifier = identifier;
    this.feeds = [...feeds];
    this.internalWebhook = internalWebhook;

    this.onOpenCallback = onOpenCallback;
    this.onCloseCallback = onCloseCallback;

    this.logger = new LogsManager(db, this.redis);
  }

  private async launchWebhooks(payload: WebhookPayloadType) {
    const promises = [];
    // Sending to webhook passed through token
    if (this.internalWebhook) {
      const promise = sendWebhook(this.internalWebhook, payload)
        .then(this.processWebhookResponse.bind(this))
        // TODO: Handle errors
        .catch((e) => console.log(e));

      promises.push(promise);
    }

    // Sending to project webhooks
    const webhooks: SimpleWebhook[] = [];

    const webhooksRds = await this.redis.get(
      getWebhooksCacheName(this.projectId),
    );

    if (webhooksRds != null) {
      const zodParse = z
        .array(SimpleWebhookSchema)
        .safeParse(JSON.parse(webhooksRds));
      if (zodParse.success) {
        webhooks.push(...zodParse.data);
      }
    } else {
      const dbWebhooks = await this.db
        .select()
        .from(projectWebhookTable)
        .where(eq(projectWebhookTable.projectId, this.projectId));

      dbWebhooks.forEach((webhook) =>
        webhooks.push({
          url: webhook.url,
          secret: webhook.secret,
          options: {
            sendOnConnect: webhook.sendOnConnect,
            sendOnMessage: webhook.sendOnMessage,
            sendOnDisconnect: webhook.sendOnDisconnect,
          },
        }),
      );

      // If cache isn't hit, cache the webhooks for 60 seconds
      void this.redis.set(
        getWebhooksCacheName(this.projectId),
        JSON.stringify(webhooks),
        "EX",
        60,
      );
    }

    // Actually sending the webhooks
    webhooks.forEach((webhook) => {
      const promise = sendWebhook(webhook, payload)
        .then(this.processWebhookResponse.bind(this))
        // TODO: Handle errors
        .catch((e) => console.log(e));

      promises.push(promise);
    });

    return Promise.all(promises);
  }

  private async processWebhookResponse(
    response: z.infer<typeof WebhookResponseSchema>,
  ) {
    if (!response) return;

    const promises = [];

    // eslint-disable-next-line prefer-const
    let { messages, feeds: feedActions } = response;

    if (messages) {
      if (!Array.isArray(messages)) {
        messages = [messages];
      }

      const processMessagesPromise = processMessages(
        this.redis,
        this.projectId,
        messages,
      );
      promises.push(processMessagesPromise);

      messages.forEach((message) => {
        void this.logger.logIncomingMessage(
          this.projectId,
          this.identifier,
          message.message,
          // TODO: Make utils of isArray, because this smells bad
          message.feeds !== undefined
            ? Array.isArray(message.feeds)
              ? message.feeds
              : [message.feeds]
            : [],
          message.clients !== undefined
            ? Array.isArray(message.clients)
              ? message.clients
              : [message.clients]
            : [],
        );
      });
    }

    if (feedActions) {
      // TODO: Log feed actions
      const processFeedActionsPromise = processFeedActions(
        this.db,
        this.redis,
        this.projectId,
        feedActions,
      );

      promises.push(processFeedActionsPromise);
    }

    return Promise.all(promises);
  }

  public generateWebsocketResponder(): WSEvents | Promise<WSEvents> {
    return {
      onOpen: (evt, ws) => void sentryWrapper(() => this.onOpen(evt, ws)),
      onMessage: (evt, ws) => void sentryWrapper(() => this.onMessage(evt, ws)),
      onClose: (evt, ws) => void sentryWrapper(() => this.onClose(evt, ws)),
      onError: (evt, ws) => void sentryWrapper(() => this.onError(evt, ws)),
    };
  }

  private async onOpen(evt: Event, ws: WSContext) {
    if (this.onOpenCallback) {
      this.onOpenCallback();
    }

    void this.logger.logConnection(this.projectId, this.identifier, this.feeds);

    void this.usageManager.addConcurrentConnection(this.projectId);

    // TODO: Handle errors
    // Subscribing to identifier channel and feeds channels
    void this.redisSubscriber.subscribe(
      getMainChannelName(this.projectId, this.identifier),
    );

    this.feeds.forEach((feed) => {
      void this.redisSubscriber.subscribe(
        getFeedChannelName(this.projectId, feed),
      );
    });

    // Initializing message listener
    this.redisSubscriber.on("message", (channel, message) => {
      // If connection is closing, don't process messages
      if (this.closing) return;

      const messagePayload = JSON.parse(message) as unknown;

      // TODO: Handle errors
      const payload = RedisMessageSchema.parse(messagePayload);

      switch (payload.type) {
        case "join-feed":
          {
            this.feeds.push(payload.data.feed);
            void this.redisSubscriber.subscribe(
              getFeedChannelName(this.projectId, payload.data.feed),
            );
          }
          break;
        case "leave-feed":
          {
            this.feeds.splice(this.feeds.indexOf(payload.data.feed), 1);
            void this.redisSubscriber.unsubscribe(
              getFeedChannelName(this.projectId, payload.data.feed),
            );
          }
          break;
        case "set-feeds":
          {
            const toUnsubscribe = this.feeds.filter(
              (feed) => !payload.data.feeds.includes(feed),
            );
            const toSubscribe = payload.data.feeds.filter(
              (feed) => !this.feeds.includes(feed),
            );

            toUnsubscribe.forEach((feed) => {
              this.feeds.splice(this.feeds.indexOf(feed), 1);
              void this.redisSubscriber.unsubscribe(
                getFeedChannelName(this.projectId, feed),
              );
            });

            toSubscribe.forEach((feed) => {
              this.feeds.push(feed);
              void this.redisSubscriber.subscribe(
                getFeedChannelName(this.projectId, feed),
              );
            });
          }
          break;
        case "send-message":
          {
            ws.send(payload.data.message);
          }
          break;
      }
    });

    void this.launchWebhooks({
      action: EWebhookActions.CONNECTION_OPEN,
      data: {
        connection: {
          clientId: this.projectClientId,
          identifier: this.identifier,
        },
      },
    });
  }

  private async onMessage(evt: MessageEvent<WSMessageReceive>, ws: WSContext) {
    if (this.closing) return;

    console.log(`Message from client: ${evt.data}`);

    // Logging outgoing message
    void this.logger.logOutgointMessage(
      this.projectId,
      this.identifier,
      evt.data,
    );

    void this.launchWebhooks({
      action: EWebhookActions.MESSAGE,
      data: {
        connection: {
          clientId: this.projectClientId,
          identifier: this.identifier,
        },
        message: evt.data,
      },
    });
  }

  private async onClose(evt: CloseEvent, ws: WSContext) {
    this.closing = true;
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }

    // Logging disconnection
    void this.logger.logDisconnection(this.projectId, this.identifier);

    // Removing connection from usage manager
    void this.usageManager.removeConcurrentConnection(this.projectId);

    // Unsubscribing from identifier channel and feeds channels
    void this.redisSubscriber.unsubscribe(
      getMainChannelName(this.projectId, this.identifier),
    );

    for (const feed of this.feeds) {
      void this.redisSubscriber.unsubscribe(
        getFeedChannelName(this.projectId, feed),
      );
    }

    return (async () => {
      await this.launchWebhooks({
        action: EWebhookActions.CONNECTION_CLOSE,
        data: {
          connection: {
            clientId: this.projectClientId,
            identifier: this.identifier,
          },
        },
      });

      void this.redis.quit(() => console.log("Redis closed"));
      void this.redisSubscriber.quit(() =>
        console.log("Redis subscriber closed"),
      );

      console.log("Connection closed");
    })();
  }

  private async onError(evt: Event, ws: WSContext) {
    // TODO implement onError
  }
}
