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
import { verifyToken } from "@socketless/connection-tokens";
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

import { sendWebhook } from "./webhook";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();

app.get("/", (c) =>
  c.text(
    "Hey there! I see you're trying to sniff around 👀. Don't worry, you won't find anything here, so go check our main website socketless.ws",
  ),
);

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

      c.set("projectId", payload.projectId);
      c.set("identifier", payload.identifier);
      c.set("clientId", payload.clientId);
      c.set("feeds", payload.feeds);
      c.set("webhook", payload.webhook);

      return next();
    } catch {
      c.status(401);
      return c.text("Unauthorized");
    }
  },
);

app.get(
  "/:token",
  tokenValidationMiddleware,
  upgradeWebSocket((c) => {
    const redisSubscriber = createRedisClient();
    const redis = createRedisClient();
    const wscontext = c as Context<WebsocketContext>;

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
      if (internalWebhook) {
        void sendWebhook(internalWebhook, payload)
          .then(processWebhookResponse)
          // TODO: Handle errors
          .catch((e) => console.log(e));
      }

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

        void redis.set(
          getWebhooksCacheName(projectId),
          JSON.stringify(webhooks),
          "EX",
          60,
        );
      }

      webhooks.forEach((webhook) => {
        void sendWebhook(webhook, payload)
          .then(processWebhookResponse)
          // TODO: Handle errors
          .catch((e) => console.log(e));
      });
    };

    const processWebhookResponse = (
      response: z.infer<typeof WebhookResponseSchema>,
    ) => {
      if (!response) return;

      const { messages, feeds: feedActions } = response;

      if (messages) {
        void processMessages(redis, projectId, messages);
      }

      if (feedActions) {
        void processFeedActions(db, redis, projectId, feedActions);
      }
    };

    return {
      onOpen(evt, ws) {
        // TODO: Handle errors
        void redisSubscriber.subscribe(mainChannel);

        initialFeeds.forEach((feed) => {
          void redisSubscriber.subscribe(getFeedChannelName(projectId, feed));
        });

        redisSubscriber.on("message", (channel, message) => {
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
      },
      onMessage(event) {
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

        console.log(`Message from client: ${event.data}`);
      },
      onClose: () => {
        void redisSubscriber.unsubscribe(mainChannel);

        for (const feed of feeds) {
          void redisSubscriber.unsubscribe(getFeedChannelName(projectId, feed));
        }

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
      },
    };
  }),
);

Bun.serve({
  fetch: app.fetch,
  websocket,
  port: 3100,
});

console.log("Server started at http://localhost:3100");
