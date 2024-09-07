import "./external/instrument";

import type { Context } from "hono";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { createMiddleware } from "hono/factory";

import type { SimpleWebhook } from "@socketless/shared";
import {
  InvalidTokenPayloadContents,
  verifyToken,
} from "@socketless/connection-tokens";
import { db } from "@socketless/db/client";
import { createRedisClient } from "@socketless/redis/client";

import { ConnectedClient } from "./ConnectedClient";
import { UsageManager } from "./internal/usage";

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

const clients: ConnectedClient[] = [];

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
      usageManager,
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
  websocket,
  port: 3100,
});

console.log("Server started");
