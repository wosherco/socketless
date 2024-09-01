import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { createMiddleware } from "hono/factory";

import { verifyToken } from "@socketless/connection-tokens";
import { and, eq } from "@socketless/db";
import { db } from "@socketless/db/client";
import { connectionRoomsTable } from "@socketless/db/schema";
import { getMainChannelName, getRoomChannelName } from "@socketless/redis";
import { createRedisClient } from "@socketless/redis/client";
import { RedisMessageSchema } from "@socketless/redis/schemas";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();

const tokenValidationMiddleware = createMiddleware<{
  Variables: {
    projectId: number;
    identifier: string;
    // TODO: Standarize type
    webhook?: {
      url: string;
    };
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
    const identifier = c.get("identifier");
    const internalWebhook = c.get("webhook");

    const mainChannel = getMainChannelName(projectId, identifier);

    const rooms: string[] = [];

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

        // TODO: Fetch project data from redis (cache)
        // TODO: Fetch project data from postgres if missing
        // TODO: Send webhooks
        // TODO: Do smth with webhook responses

        console.log("Connection opened");
      },
      onMessage(event, ws) {
        // TODO: Fetch project data from redis (cache)
        // TODO: Fetch project data from postgres if missing
        // TODO: Send webhooks
        // TODO: Do smth with webhook responses
        console.log(`Message from client: ${event.data}`);
      },
      onClose: () => {
        redis.unsubscribe(mainChannel);

        for (const room of rooms) {
          redis.unsubscribe(getRoomChannelName(projectId, room));
        }

        redis.quit(() => console.log("Redis closed"));

        // TODO: Fetch project data from redis (cache)
        // TODO: Fetch project data from postgres if missing
        // TODO: Send webhooks
        // TODO: Do smth with webhook responses

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
