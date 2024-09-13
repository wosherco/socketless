import { z } from "zod";

import { FeedNameValidator } from "./types";
import {
  SimpleWebhookSchema,
  WebhookFeedsManageResponseSchema,
  WebhookMessageResponseSchema,
} from "./webhooks";

export const ApiPostConnectRequestSchema = z.object({
  identifier: z.string(),
  webhook: SimpleWebhookSchema.optional(),
  feeds: z.array(FeedNameValidator).optional(),
  overrideFeeds: z.boolean().default(true).optional(),
});

export const ApiPostConnectResponseSchema = z.object({
  token: z.string(),
  identifier: z.string(),
  url: z.string(),
});

export const ApiPostFeedsRequestSchema = z.object({
  actions: z
    .array(WebhookFeedsManageResponseSchema)
    .or(WebhookFeedsManageResponseSchema),
});

export const ApiPostMessageRequestSchema = z.object({
  messages: z
    .array(WebhookMessageResponseSchema)
    .or(WebhookMessageResponseSchema),
});
