import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { createMiddleware } from "hono/factory";

import { verifyToken } from "@socketless/connection-tokens";
import { getMainChannelName, getRoomChannelName } from "@socketless/redis";
import { createRedisClient } from "@socketless/redis/client";
import { RedisMessageSchema } from "@socketless/redis/schemas";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();

const tokenValidationMiddleware = createMiddleware<{
  Variables: {
    projectId: number;
    identifier: string;
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

    const mainChannel = getMainChannelName(
      c.get("projectId"),
      c.get("identifier"),
    );

    // TODO: Get rooms from db, and subscribe
    const rooms: string[] = [];

    return {
      onOpen(evt, ws) {
        // TODO: Handle errors
        redis.subscribe(mainChannel);

        for (const room of rooms) {
          redis.subscribe(getRoomChannelName(c.get("projectId"), room));
        }

        redis.on("message", (channel, message) => {
          const messagePayload = JSON.parse(message);

          // TODO: Handle errors
          const payload = RedisMessageSchema.parse(messagePayload);

          switch (payload.type) {
            case "join-room":
              rooms.push(payload.data.room);
              redis.subscribe(
                getRoomChannelName(c.get("projectId"), payload.data.room),
              );
              break;
            case "leave-room":
              rooms.splice(rooms.indexOf(payload.data.room), 1);
              redis.unsubscribe(
                getRoomChannelName(c.get("projectId"), payload.data.room),
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
          redis.unsubscribe(getRoomChannelName(c.get("projectId"), room));
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
