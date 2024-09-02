import { z } from "zod";

import { RoomNameValidator } from "./types";
import {
  SimpleWebhookSchema,
  WebhookMessageResponseSchema,
  WebhookRoomsManageResponseSchema,
} from "./webhooks";

export const ApiPostConnectRequestSchema = z.object({
  identifier: z.string(),
  webhook: SimpleWebhookSchema.optional(),
  rooms: z.array(RoomNameValidator).optional(),
  overrideRooms: z.boolean().default(true).optional(),
});

export const ApiPostConnectResponseSchema = z.object({
  token: z.string(),
  identifier: z.string(),
  url: z.string(),
});

export const ApiPostRoomsRequestSchema = z.object({
  actions: z
    .array(WebhookRoomsManageResponseSchema)
    .or(WebhookRoomsManageResponseSchema),
});

export const ApiPostMessageRequestSchema = z.object({
  messages: z
    .array(WebhookMessageResponseSchema)
    .or(WebhookMessageResponseSchema),
});
