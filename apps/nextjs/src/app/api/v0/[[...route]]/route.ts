import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { bearerAuth } from "hono/bearer-auth";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";

import {
  connectionJoinRoom,
  connectionSetRooms,
  createConnection,
  getConnectionRooms,
  processMessages,
  processRoomActions,
  validateProjectToken,
} from "@socketless/api/logic";
import { db } from "@socketless/db/client";
import { createRedisClient } from "@socketless/redis/client";
import {
  ApiPostConnectRequestSchema,
  ApiPostConnectResponseSchema,
  ApiPostMessageRequestSchema,
  ApiPostRoomsRequestSchema,
  WebhookPayloadSchema,
  WebhookResponseSchema,
} from "@socketless/shared";

// export const runtime = 'edge'

type TokenValidationFunc = Exclude<
  Awaited<ReturnType<typeof validateProjectToken>>,
  undefined
>;

const app = new OpenAPIHono<{
  Variables: {
    project: TokenValidationFunc["project"];
    token: TokenValidationFunc["project_token"];
  };
}>().basePath("/api/v0");

app.use(
  "*",
  cors({
    origin: ["https://socketless.ws", "https://docs.socketless.ws"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Authorization"],
  }),
);

const authenticationMiddleware = bearerAuth({
  async verifyToken(token, c) {
    const project = await validateProjectToken(db, token);
    if (!project) {
      return false;
    }

    c.set("project", project.project);
    c.set("token", project.project_token);

    return true;
  },
});

// Component for Bearer <token> authorization
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "apiKey",
  scheme: "bearer",
});

// Default for unauthorized requests
const DEFAULT_RESPONSES = {
  400: {
    description: "Bad Request",
    content: {
      "text/plain": {
        schema: z.string(),
      },
    },
  },
  401: {
    description: "Unauthorized",
    content: {
      "text/plain": {
        schema: z.string(),
      },
    },
  },
} as const;

// Adding webhook information
app.openAPIRegistry.registerWebhook({
  method: "post",
  path: "Webhook",
  request: {
    body: {
      content: {
        "application/json": {
          schema: WebhookPayloadSchema,
        },
      },
    },
    headers: z.object({
      "x-socketless-signature": z.string({
        description: "Signature of payload in HMAC-SHA256",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: WebhookResponseSchema,
        },
      },
      headers: {
        Authorization: {
          summary: "Bearer token with webhooks secret",
        },
      },
      description: "Webhook response",
    },
  },
});

const postConnectionToken = createRoute({
  method: "post",
  path: "/connection",
  description: "Retrieve the connection token for the client",
  middleware: [authenticationMiddleware],
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ApiPostConnectRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiPostConnectResponseSchema,
        },
      },
      description: "Retrieve the connection token for the client",
    },
    ...DEFAULT_RESPONSES,
  },
});

const postRooms = createRoute({
  method: "post",
  path: "/rooms",
  description: "Manage rooms",
  middleware: [authenticationMiddleware],
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ApiPostRoomsRequestSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: "Successfully managed rooms",
    },
    ...DEFAULT_RESPONSES,
  },
});

const postMessage = createRoute({
  method: "post",
  path: "/message",
  description: "Send messages to clients and rooms",
  middleware: [authenticationMiddleware],
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ApiPostMessageRequestSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: "Successfully send messages",
    },
    ...DEFAULT_RESPONSES,
  },
});

app.openapi(postConnectionToken, async (c) => {
  const project = c.var.project;
  const payload = c.req.valid("json");

  const rooms: string[] = [];

  if (payload.rooms && payload.overrideRooms) {
    rooms.push(...payload.rooms);
    const redis = createRedisClient();
    await connectionSetRooms(
      db,
      redis,
      project.id,
      payload.identifier,
      payload.rooms,
    );
    void redis.quit();
  } else {
    const currentRooms = await getConnectionRooms(
      db,
      project.id,
      payload.identifier,
    );

    rooms.push(...currentRooms.map((r) => r.room));

    if (payload.rooms && !payload.overrideRooms) {
      const redis = createRedisClient();
      await connectionJoinRoom(
        db,
        redis,
        project.id,
        payload.identifier,
        payload.rooms.filter((room) => !rooms.includes(room)),
      );
      void redis.quit();

      rooms.push(...payload.rooms);
    }
  }

  const token = await createConnection(
    project.id,
    project.clientId,
    payload.identifier,
    rooms,
    payload.webhook,
  );

  return c.json(
    {
      token: token,
      identifier: payload.identifier,
      url: `wss://connect.socketless.ws/${token}`,
    },
    200,
  );
});

app.openapi(postRooms, async (c) => {
  const project = c.var.project;
  const payload = c.req.valid("json");

  const redis = createRedisClient();

  await processRoomActions(db, redis, project.id, payload.actions);

  await redis.quit();

  return c.text("", 204);
});

app.openapi(postMessage, async (c) => {
  const project = c.var.project;
  const payload = c.req.valid("json");

  const redis = createRedisClient();

  await processMessages(redis, project.id, payload.messages);

  await redis.quit();

  return c.text("", 204);
});

app.doc31("/doc", {
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: "Socketless API",
  },
});

export const GET = handle(app);
export const POST = handle(app);
