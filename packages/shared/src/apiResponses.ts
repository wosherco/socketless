import { z } from "zod";

import { SimpleWebhookSchema } from "./schemas";

export const ApiPostConnectRequestSchema = z.object({
  identifier: z.string(),
  webhook: SimpleWebhookSchema.optional(),
});

export const ApiPostConnectResponseSchema = z.object({
  token: z.string(),
  identifier: z.string(),
  url: z.string(),
});
