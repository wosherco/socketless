import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import Redis from "ioredis";

import { env } from "../env";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();
const redis = new Redis(env.REDIS_URL);

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`);
        ws.send("Hello from server!");
      },
      onClose: () => {
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
