import { z } from "@hono/zod-openapi";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { createMiddleware } from "hono/factory";

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
import {
  EWebhookActions,
  SimpleWebhook,
  SimpleWebhookSchema,
  WebhookPayloadType,
  WebhookResponseSchema,
} from "@socketless/validators/types";

import { sendWebhook } from "./webhook";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();

const tokenValidationMiddleware = createMiddleware<{
  Variables: {
    projectId: number;
    identifier: string;
    clientId: string;
    webhook?: SimpleWebhook;
  };
}>(async (c, next) => {
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
    c.set("webhook", payload.webhook);

    return next();
  } catch (e) {
    c.status(401);
    return c.text("Unauthorized");
  }
});

app.get(
  "/:token",
  tokenValidationMiddleware,
  upgradeWebSocket((c) => {
    const redis = createRedisClient();

    const projectId = c.get("projectId");
    const clientId = c.get("clientId");
    const identifier = c.get("identifier");
    const internalWebhook = c.get("webhook");

    const mainChannel = getMainChannelName(projectId, identifier);

    const rooms: string[] = [];

    const launchWebhooks = async (payload: WebhookPayloadType) => {
      if (internalWebhook) {
        // TODO: Put secret here
        sendWebhook(internalWebhook, "", payload).then(processWebhookResponse);
      }

      const webhooks: SimpleWebhook[] = [];

      const webhooksRds = await redis.get(getWebhooksCacheName(projectId));

      if (webhooksRds) {
        const parsed = JSON.parse(webhooksRds);
        const zodParse = z.array(SimpleWebhookSchema).safeParse(parsed);
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

        redis.set(
          getWebhooksCacheName(projectId),
          JSON.stringify(webhooks),
          "EX",
          60,
        );
      }

      webhooks.forEach((webhook) => {
        sendWebhook(webhook, webhook.secret, payload).then(
          processWebhookResponse,
        );
      });
    };

    const processWebhookResponse = async (
      response: z.infer<typeof WebhookResponseSchema>,
    ) => {
      // TODO: Do something with responses
    };

    return {
      onOpen(evt, ws) {
        // TODO: Handle errors
        redis.subscribe(mainChannel);

        db.select()
          .from(connectionRoomsTable)
          .where(
            and(
              eq(connectionRoomsTable.projectId, projectId),
              eq(connectionRoomsTable.identifier, identifier),
            ),
          )
          .then((dbRooms) =>
            dbRooms.forEach((room) => {
              rooms.push(room.room);
              redis.subscribe(getRoomChannelName(projectId, room.room));
            }),
          );

        redis.on("message", (channel, message) => {
          const messagePayload = JSON.parse(message);

          // TODO: Handle errors
          const payload = RedisMessageSchema.parse(messagePayload);

          switch (payload.type) {
            case "join-room":
              rooms.push(payload.data.room);
              redis.subscribe(getRoomChannelName(projectId, payload.data.room));
              break;
            case "leave-room":
              rooms.splice(rooms.indexOf(payload.data.room), 1);
              redis.unsubscribe(
                getRoomChannelName(projectId, payload.data.room),
              );
              break;
            case "send-message":
              ws.send(payload.data.message);
              break;
          }
        });

        launchWebhooks({
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
        launchWebhooks({
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
        redis.unsubscribe(mainChannel);

        for (const room of rooms) {
          redis.unsubscribe(getRoomChannelName(projectId, room));
        }

        launchWebhooks({
          action: EWebhookActions.CONNECTION_CLOSE,
          data: {
            connection: {
              clientId,
              identifier,
            },
          },
        });

        redis.quit(() => console.log("Redis closed"));

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
