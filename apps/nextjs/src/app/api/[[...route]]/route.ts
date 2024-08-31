import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { handle } from "hono/vercel";

// export const runtime = 'edge'

const app = new OpenAPIHono().basePath("/api");

const route = createRoute({
  method: "get",
  path: "/users",
  request: {},
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "Retrieve the user",
    },
  },
});

app.openapi(route, (c) => {
  return c.json({
    message: "Hello Next.js!",
  });
});

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
});

export const GET = handle(app);
export const POST = handle(app);
