import type { WSContext, WSEvents, WSMessageReceive } from "hono/ws";
import { z } from "@hono/zod-openapi";
import * as Sentry from "@sentry/bun";

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

import { sentryWrapper } from "./external/sentry";
import { LogsManager } from "./internal/logs";
import { UsageManager } from "./internal/usage";
import { sendWebhook } from "./webhook";

const PING_INTERVAL = 5000;

export class ConnectedClient {
  private closing = false;

  private db: DBType;
  private redis: RedisType;
  private redisSubscriber: RedisType;
  private usageManager: UsageManager;

  private projectId: number;
  private projectClientId: string;
  private identifier: string;
  private feeds: string[];
  private internalWebhook?: SimpleWebhook;
  private connectionId?: number;

  private onOpenCallback?: () => void;
  private onCloseCallback?: () => void;

  private logger: LogsManager;

  private lastPong: number = Date.now();
  private pingInterval: Timer | null = null;

  constructor(
    db: DBType,
    projectId: number,
    projectClientId: string,
    identifier: string,
    feeds: string[],
    internalWebhook?: SimpleWebhook,
    onOpenCallback?: () => void,
    onCloseCallback?: () => void,
  ) {
    this.db = db;
    this.redisSubscriber = createRedisClient();
    this.redis = createRedisClient();
    this.usageManager = new UsageManager(db, this.redis, projectId);

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

      for (const message of messages) {
        const canSend = await this.usageManager.canSendIncomingMessage();
        if (!canSend) {
          return;
        }

        const processMessagesPromise = processMessages(
          this.redis,
          this.projectId,
          message,
        );
        promises.push(processMessagesPromise);

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
      }
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

    // Starting ping interval
    this.pingInterval = setInterval(() => {
      if (Date.now() - this.lastPong > PING_INTERVAL * 3) {
        ws.close(1000, "Ping timeout");
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
        }
      } else {
        ws.send("");
        console.log(`Sending ping to client: ${this.identifier}`);
      }
    }, PING_INTERVAL);

    const promises = [];

    promises.push(
      this.logger.logConnection(this.projectId, this.identifier, this.feeds),
    );
    promises.push(
      this.usageManager
        .addConcurrentConnection(this.identifier)
        .then((connection) => (this.connectionId = connection.id)),
    );

    // TODO: Handle errors
    // Subscribing to identifier channel and feeds channels
    promises.push(
      this.redisSubscriber.subscribe(
        getMainChannelName(this.projectId, this.identifier),
      ),
    );

    promises.push(
      this.feeds.map((feed) =>
        this.redisSubscriber.subscribe(
          getFeedChannelName(this.projectId, feed),
        ),
      ),
    );

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

    promises.push(
      this.launchWebhooks({
        action: EWebhookActions.CONNECTION_OPEN,
        data: {
          connection: {
            clientId: this.projectClientId,
            identifier: this.identifier,
          },
        },
      }),
    );

    return Promise.all(promises);
  }

  private async onMessage(evt: MessageEvent<WSMessageReceive>, __: WSContext) {
    if (this.closing) return;

    if (evt.data === "") {
      this.lastPong = Date.now();
      console.log(`Pong from client: ${this.identifier}`);
      return;
    }

    const promises = [];

    console.log(`Message from client: ${this.identifier}`);

    const canSend = await this.usageManager.canSendOutgoingMessage();

    if (!canSend) {
      return;
    }

    // Logging outgoing message
    promises.push(
      this.logger.logOutgointMessage(
        this.projectId,
        this.identifier,
        // evt.data
      ),
    );

    promises.push(
      this.launchWebhooks({
        action: EWebhookActions.MESSAGE,
        data: {
          connection: {
            clientId: this.projectClientId,
            identifier: this.identifier,
          },
          message: evt.data,
        },
      }),
    );

    return Promise.all(promises);
  }

  private async onClose(_: CloseEvent, __: WSContext) {
    this.closing = true;
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }

    const promises = [];

    // Logging disconnection
    promises.push(
      this.logger.logDisconnection(this.projectId, this.identifier),
    );

    // Removing connection from usage manager
    if (this.connectionId !== undefined) {
      promises.push(
        this.usageManager.removeConcurrentConnection(this.connectionId),
      );
    } else {
      console.error("Connection ID is undefined");
    }

    // Unsubscribing from identifier channel and feeds channels
    promises.push(
      this.redisSubscriber.unsubscribe(
        getMainChannelName(this.projectId, this.identifier),
      ),
    );
    promises.push(
      this.feeds.map((feed) =>
        this.redisSubscriber.unsubscribe(
          getFeedChannelName(this.projectId, feed),
        ),
      ),
    );

    const finalPromise = async () => {
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
    };

    promises.push(finalPromise());

    return Promise.all(promises);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async onError(_: Event, __: WSContext) {
    Sentry.captureException(
      new Error(`Websocket error ${this.projectId} ${this.identifier}`),
    );
  }
}
