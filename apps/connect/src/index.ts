import type { Context } from "hono";
import { z } from "@hono/zod-openapi";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { createMiddleware } from "hono/factory";

import type {
  SimpleWebhook,
  WebhookPayloadType,
  WebhookResponseSchema,
} from "@socketless/shared";
import { processFeedActions, processMessages } from "@socketless/api/logic";
import {
  InvalidTokenPayloadContents,
  verifyToken,
} from "@socketless/connection-tokens";
import { eq } from "@socketless/db";
import { db } from "@socketless/db/client";
import { projectWebhookTable } from "@socketless/db/schema";
import {
  getFeedChannelName,
  getMainChannelName,
  getWebhooksCacheName,
} from "@socketless/redis";
import { createRedisClient } from "@socketless/redis/client";
import { RedisMessageSchema } from "@socketless/redis/schemas";
import { EWebhookActions, SimpleWebhookSchema } from "@socketless/shared";

import { LogsManager } from "./logs";
import { UsageManager } from "./usage";
import { sendWebhook } from "./webhook";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();

app.get("/", (c) =>
  c.text(
    "Hey there! I see you're trying to sniff around 👀. Don't worry, you won't find anything here, so go check our main website socketless.ws",
  ),
);

// Usage Manager
const globalRedis = createRedisClient();
const usageManager = new UsageManager(db, globalRedis);

interface WebsocketContext {
  Variables: {
    projectId: number;
    identifier: string;
    clientId: string;
    feeds: string[];
    webhook?: SimpleWebhook;
  };
}
const tokenValidationMiddleware = createMiddleware<WebsocketContext>(
  async (c, next) => {
    const token = c.req.param("token");

    if (token === undefined) {
      c.status(401);
      return c.text("Unauthorized");
    }

    try {
      const payload = await verifyToken(token);
      const canConnect = await usageManager.canConnect(payload.projectId);

      if (!canConnect) {
        return c.text("Too Many Requests", 429);
      }

      c.set("projectId", payload.projectId);
      c.set("identifier", payload.identifier);
      c.set("clientId", payload.clientId);
      c.set("feeds", payload.feeds);
      c.set("webhook", payload.webhook);

      return next();
    } catch (e) {
      if (e instanceof InvalidTokenPayloadContents) {
        console.log(e.originalContent, e.errors.errors);
      }
      return c.text("Unauthorized", 401);
    }
  },
);

app.get(
  "/:token",
  tokenValidationMiddleware,
  upgradeWebSocket((c) => {
    const redisSubscriber = createRedisClient();
    const redis = createRedisClient();
    const logger = new LogsManager(db, redis);
    const wscontext = c as Context<WebsocketContext>;
    let closing = false;

    const {
      projectId,
      clientId,
      identifier,
      feeds: initialFeeds,
    } = wscontext.var;
    const internalWebhook = wscontext.var.webhook;

    const mainChannel = getMainChannelName(projectId, identifier);

    const feeds: string[] = [...initialFeeds];

    const launchWebhooks = async (payload: WebhookPayloadType) => {
      const promises = [];
      // Sending to webhook passed through token
      if (internalWebhook) {
        const promise = sendWebhook(internalWebhook, payload)
          .then(processWebhookResponse)
          // TODO: Handle errors
          .catch((e) => console.log(e));

        promises.push(promise);
      }

      // Sending to project webhooks
      const webhooks: SimpleWebhook[] = [];

      const webhooksRds = await redis.get(getWebhooksCacheName(projectId));

      if (webhooksRds != null) {
        const zodParse = z
          .array(SimpleWebhookSchema)
          .safeParse(JSON.parse(webhooksRds));
        if (zodParse.success) {
          webhooks.push(...zodParse.data);
        }
      } else {
        const dbWebhooks = await db
          .select()
          .from(projectWebhookTable)
          .where(eq(projectWebhookTable.projectId, projectId));

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
        void redis.set(
          getWebhooksCacheName(projectId),
          JSON.stringify(webhooks),
          "EX",
          60,
        );
      }

      // Actually sending the webhooks
      webhooks.forEach((webhook) => {
        const promise = sendWebhook(webhook, payload)
          .then(processWebhookResponse)
          // TODO: Handle errors
          .catch((e) => console.log(e));

        promises.push(promise);
      });

      await Promise.all(promises);
    };

    const processWebhookResponse = (
      response: z.infer<typeof WebhookResponseSchema>,
    ) => {
      if (!response) return;

      const promises = [];

      // eslint-disable-next-line prefer-const
      let { messages, feeds: feedActions } = response;

      if (messages) {
        if (!Array.isArray(messages)) {
          messages = [messages];
        }

        const processMessagesPromise = processMessages(
          redis,
          projectId,
          messages,
        );
        promises.push(processMessagesPromise);

        messages.forEach((message) => {
          void logger.logIncomingMessage(
            projectId,
            identifier,
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
          db,
          redis,
          projectId,
          feedActions,
        );

        promises.push(processFeedActionsPromise);
      }

      return Promise.all(promises);
    };

    return {
      onOpen(evt, ws) {
        try {
          // Logging connection
          void logger.logConnection(projectId, identifier, feeds);

          // Adding connection to usage manager
          void usageManager.addConcurrentConnection(projectId);

          // TODO: Handle errors
          // Subscribing to identifier channel and feeds channels
          void redisSubscriber.subscribe(mainChannel);

          initialFeeds.forEach((feed) => {
            void redisSubscriber.subscribe(getFeedChannelName(projectId, feed));
          });

          // Initializing message listener
          redisSubscriber.on("message", (channel, message) => {
            // If connection is closing, don't process messages
            if (closing) return;

            const messagePayload = JSON.parse(message) as unknown;

            // TODO: Handle errors
            const payload = RedisMessageSchema.parse(messagePayload);

            switch (payload.type) {
              case "join-feed":
                {
                  feeds.push(payload.data.feed);
                  void redisSubscriber.subscribe(
                    getFeedChannelName(projectId, payload.data.feed),
                  );
                }
                break;
              case "leave-feed":
                {
                  feeds.splice(feeds.indexOf(payload.data.feed), 1);
                  void redisSubscriber.unsubscribe(
                    getFeedChannelName(projectId, payload.data.feed),
                  );
                }
                break;
              case "set-feeds":
                {
                  const toUnsubscribe = feeds.filter(
                    (feed) => !payload.data.feeds.includes(feed),
                  );
                  const toSubscribe = payload.data.feeds.filter(
                    (feed) => !feeds.includes(feed),
                  );

                  toUnsubscribe.forEach((feed) => {
                    feeds.splice(feeds.indexOf(feed), 1);
                    void redisSubscriber.unsubscribe(
                      getFeedChannelName(projectId, feed),
                    );
                  });

                  toSubscribe.forEach((feed) => {
                    feeds.push(feed);
                    void redisSubscriber.subscribe(
                      getFeedChannelName(projectId, feed),
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

          // Launching webhooks for connection open
          void launchWebhooks({
            action: EWebhookActions.CONNECTION_OPEN,
            data: {
              connection: {
                clientId,
                identifier,
              },
            },
          });

          console.log("Connection opened");
        } catch (e) {
          console.error("Error onOpen:", e);
        }
      },
      onMessage(event) {
        try {
          if (closing) return;

          console.log(`Message from client: ${event.data}`);

          // Logging outgoing message
          void logger.logOutgointMessage(projectId, identifier, event.data);

          void launchWebhooks({
            action: EWebhookActions.MESSAGE,
            data: {
              connection: {
                clientId,
                identifier,
              },
              message: event.data,
            },
          });
        } catch (e) {
          console.error("Error onMessage:", e);
        }
      },
      onClose: () => {
        try {
          closing = true;
          // Logging disconnection
          void logger.logDisconnection(projectId, identifier);

          // Removing connection from usage manager
          void usageManager.removeConcurrentConnection(projectId);

          // Unsubscribing from identifier channel and feeds channels
          void redisSubscriber.unsubscribe(mainChannel);

          for (const feed of feeds) {
            void redisSubscriber.unsubscribe(
              getFeedChannelName(projectId, feed),
            );
          }

          // Launching webhooks for connection close
          void (async () => {
            await launchWebhooks({
              action: EWebhookActions.CONNECTION_CLOSE,
              data: {
                connection: {
                  clientId,
                  identifier,
                },
              },
            });

            void redis.quit(() => console.log("Redis closed"));
            void redisSubscriber.quit(() =>
              console.log("Redis subscriber closed"),
            );

            console.log("Connection closed");
          })();
        } catch (e) {
          console.error("Error onClose:", e);
        }
      },
    };
  }),
);

Bun.serve({
  fetch: app.fetch,
  websocket,
  port: 3100,
});

console.log("Server started");
