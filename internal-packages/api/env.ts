import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { env as jwtEnv } from "@socketless/connection-tokens/env";

export const env = createEnv({
  extends: [jwtEnv],
  server: {
    POSTGRES_URL: z.string().min(1),
    REDIS_URL: z.string().url(),
    STRIPE_PUBLIC_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
  },
  client: {},
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: process.env.CI == undefined,
});
