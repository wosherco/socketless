import "./external/instrument";

import type { Context } from "hono";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { createMiddleware } from "hono/factory";

import type { PongMessage } from "@socketless/redis";
import type { SimpleWebhook } from "@socketless/shared";
import {
  InvalidTokenPayloadContents,
  verifyToken,
} from "@socketless/connection-tokens";
import { db } from "@socketless/db/client";
import { getHeartbeatChannelName } from "@socketless/redis";
import { createRedisClient } from "@socketless/redis/client";

import { env } from "../env";
import { ConnectedClient } from "./ConnectedClient";
import { NODE_NAME } from "./internal/id";
import { UsageManager } from "./internal/usage";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();

app.get("/", (c) =>
  c.text(
    "Hey there! I see you're trying to sniff around 👀. Don't worry, you won't find anything here, so go check our main website socketless.ws",
  ),
);

// Contains all connected clients in this instance
const clients: ConnectedClient[] = [];

// Global Redis client for publishing and subscribing to messages to master
const globalRedis = createRedisClient();
const globalRedisSubscriber = createRedisClient();

await globalRedisSubscriber.subscribe(getHeartbeatChannelName(NODE_NAME));
globalRedisSubscriber.on("message", (channel, message) => {
  if (message === "ping") {
    void globalRedis.publish(
      channel,
      JSON.stringify({
        node: NODE_NAME,
        message: "pong",
        connectedClients: clients.map((c) => ({
          connectionId: c.getConnectionId(),
          projectId: c.getProjectId(),
          identifier: c.getIdentifier(),
        })),
      } satisfies PongMessage),
    );
  }
});

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

      // TODO: This logic should be moved to the ConnectedClient...
      const usageManager = new UsageManager(db, globalRedis, payload.projectId);
      const canConnect = await usageManager.canConnect();

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
    const wscontext = c as Context<WebsocketContext>;

    const {
      projectId,
      clientId,
      identifier,
      feeds: initialFeeds,
    } = wscontext.var;

    const internalWebhook = wscontext.var.webhook;

    const connectedClient = new ConnectedClient(
      db,
      projectId,
      clientId,
      identifier,
      initialFeeds,
      internalWebhook,
      () => clients.push(connectedClient),
      () => clients.splice(clients.indexOf(connectedClient), 1),
    );

    return connectedClient.generateWebsocketResponder();
  }),
);

Bun.serve({
  fetch: app.fetch,
  websocket: {
    ...websocket,
    sendPings: true,
  },
  port: env.PORT,
});

console.log("Server started");
