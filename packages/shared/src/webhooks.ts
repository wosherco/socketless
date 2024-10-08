import { z } from "zod";

import { FeedNameValidator } from "./types";

const _WebhookConnectionSchema = z.object({
  clientId: z.string(),
  identifier: z.string(),
});

export enum EWebhookActions {
  CONNECTION_OPEN = "CONNECTION_OPEN",
  MESSAGE = "MESSAGE",
  CONNECTION_CLOSE = "CONNECTION_CLOSE",
}

const WebhookConnectSchema = z.object({
  action: z.literal(EWebhookActions.CONNECTION_OPEN),
  data: z.object({
    connection: _WebhookConnectionSchema,
  }),
});

const WebhookMessageSchema = z.object({
  action: z.literal(EWebhookActions.MESSAGE),
  data: z.object({
    connection: _WebhookConnectionSchema,
    message: z.any(),
  }),
});

const WebhookCloseSchema = z.object({
  action: z.literal(EWebhookActions.CONNECTION_CLOSE),
  data: z.object({
    connection: _WebhookConnectionSchema,
    // code: z.number(),
    // reason: z.string(),
    // clean: z.boolean(),
  }),
});

export const WebhookPayloadSchema = z.union([
  WebhookConnectSchema,
  WebhookMessageSchema,
  WebhookCloseSchema,
]);

export type WebhookPayloadType = z.infer<typeof WebhookPayloadSchema>;

export const WebhookActions = z.nativeEnum(EWebhookActions);

export const SimpleWebhookSchema = z.object({
  url: z.string().url(),
  secret: z.string().min(1),
  options: z
    .object({
      sendOnConnect: z.boolean().default(false),
      sendOnMessage: z.boolean().default(true),
      sendOnDisconnect: z.boolean().default(false),
    })
    .default({}),
});

export type SimpleWebhook = z.infer<typeof SimpleWebhookSchema>;

export const WebhookMessageResponseSchema = z.object({
  message: z.any(),
  clients: z.array(z.string()).or(z.string()).optional(),
  feeds: z.array(FeedNameValidator).or(FeedNameValidator).optional(),
});

export type WebhookMessageResponseType = z.infer<
  typeof WebhookMessageResponseSchema
>;

export const WebhookFeedsManageResponseSchema = z.object({
  feeds: z.array(FeedNameValidator).or(FeedNameValidator),
  action: z.enum(["join", "leave", "set"]),
  clients: z.array(z.string()).or(z.string()),
});

export type WebhookFeedsManageResponseType = z.infer<
  typeof WebhookFeedsManageResponseSchema
>;

export const WebhookResponseSchema = z
  .object({
    messages: z
      .array(WebhookMessageResponseSchema)
      .or(WebhookMessageResponseSchema)
      .optional(),
    feeds: z
      .array(WebhookFeedsManageResponseSchema)
      .or(WebhookFeedsManageResponseSchema)
      .optional(),
  })
  .optional();
