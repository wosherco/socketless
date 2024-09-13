import { authRouter } from "./router/auth";
import { homeRouter } from "./router/home";
import { projectRouter } from "./router/project";
import { projectLogsRouter } from "./router/projectLogs";
import { projectTokenRouter } from "./router/projectToken";
import { projectWebhookRouter } from "./router/projectWebhook";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  home: homeRouter,
  project: projectRouter,
  projectLogs: projectLogsRouter,
  projectToken: projectTokenRouter,
  projectWebhook: projectWebhookRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
