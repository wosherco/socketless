import { authRouter } from "./router/auth";
import { homeRouter } from "./router/home";
import { projectRouter } from "./router/project";
import { projectTokenRouter } from "./router/projectToken";
import { projectWebhookRouter } from "./router/projectWebhook";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  home: homeRouter,
  project: projectRouter,
  projectToken: projectTokenRouter,
  projectWebhook: projectWebhookRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
