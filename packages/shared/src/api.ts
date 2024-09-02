import { z } from "zod";

import { SimpleWebhookSchema } from "./webhooks";

export const RoomNameValidator = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_.]+$/);

export const ApiPostConnectRequestSchema = z.object({
  identifier: z.string(),
  webhook: SimpleWebhookSchema.optional(),
});

export const ApiPostConnectResponseSchema = z.object({
  token: z.string(),
  identifier: z.string(),
  url: z.string(),
});
