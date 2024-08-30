import { authRouter } from "./router/auth";
import { homeRouter } from "./router/home";
import { projectRouter } from "./router/project";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  home: homeRouter,
  project: projectRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
