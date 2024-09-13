import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { env as jwtEnv } from "@socketless/connection-tokens/env";
import { env as dbEnv } from "@socketless/db/env";
import { env as redisEnv } from "@socketless/redis/env";

export const env = createEnv({
  extends: [jwtEnv, redisEnv, dbEnv],
  server: {
    POSTGRES_URL: z.string().min(1),
    REDIS_URL: z.string().url(),

    // Optional
    STRIPE_PUBLIC_KEY: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    CONTACT_FORM_WEBHOOK: z.string().url().optional(),
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
  skipValidation: process.env.CI !== undefined,
});
