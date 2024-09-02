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
import { processMessages, processRoomActions } from "@socketless/api/logic";
import { verifyToken } from "@socketless/connection-tokens";
import { and, eq } from "@socketless/db";
import { db } from "@socketless/db/client";
import {
  connectionRoomsTable,
  projectWebhookTable,
} from "@socketless/db/schema";
import {
  getMainChannelName,
  getRoomChannelName,
  getWebhooksCacheName,
} from "@socketless/redis";
import { createRedisClient } from "@socketless/redis/client";
import { RedisMessageSchema } from "@socketless/redis/schemas";
import { EWebhookActions, SimpleWebhookSchema } from "@socketless/shared";

import { sendWebhook } from "./webhook";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();

interface WebsocketContext {
  Variables: {
    projectId: number;
    identifier: string;
    clientId: string;
    initialRooms: string[];
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
      c.set("initialRooms", payload.initialRooms);
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
    const redis = createRedisClient();
    const wscontext = c as Context<WebsocketContext>;

    const {
      projectId,
      clientId,
      identifier,
      initialRooms,
      webhook: internalWebhook,
    } = wscontext.var;

    const mainChannel = getMainChannelName(projectId, identifier);

    const rooms: string[] = [...initialRooms];

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

      const { messages, rooms: roomActions } = response;

      if (messages) {
        void processMessages(redis, projectId, messages);
      }

      if (roomActions) {
        void processRoomActions(db, redis, projectId, roomActions);
      }
    };

    return {
      onOpen(evt, ws) {
        // TODO: Handle errors
        void redis.subscribe(mainChannel);

        initialRooms.forEach((room) => {
          void redis.subscribe(getRoomChannelName(projectId, room));
        });

        redis.on("message", (channel, message) => {
          const messagePayload = JSON.parse(message) as unknown;

          // TODO: Handle errors
          const payload = RedisMessageSchema.parse(messagePayload);

          switch (payload.type) {
            case "join-room":
              {
                rooms.push(payload.data.room);
                void redis.subscribe(
                  getRoomChannelName(projectId, payload.data.room),
                );
              }
              break;
            case "leave-room":
              {
                rooms.splice(rooms.indexOf(payload.data.room), 1);
                void redis.unsubscribe(
                  getRoomChannelName(projectId, payload.data.room),
                );
              }
              break;
            case "set-rooms":
              {
                const toUnsubscribe = rooms.filter(
                  (room) => !payload.data.rooms.includes(room),
                );
                const toSubscribe = payload.data.rooms.filter(
                  (room) => !rooms.includes(room),
                );

                toUnsubscribe.forEach((room) => {
                  rooms.splice(rooms.indexOf(room), 1);
                  void redis.unsubscribe(getRoomChannelName(projectId, room));
                });

                toSubscribe.forEach((room) => {
                  rooms.push(room);
                  void redis.subscribe(getRoomChannelName(projectId, room));
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
      onMessage(event, ws) {
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
        void redis.unsubscribe(mainChannel);

        for (const room of rooms) {
          void redis.unsubscribe(getRoomChannelName(projectId, room));
        }

        void launchWebhooks({
          action: EWebhookActions.CONNECTION_CLOSE,
          data: {
            connection: {
              clientId,
              identifier,
            },
          },
        });

        void redis.quit(() => console.log("Redis closed"));

        console.log("Connection closed");
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
