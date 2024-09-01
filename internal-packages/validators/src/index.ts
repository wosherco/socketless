import { z } from "zod";

// Fields

export const RoomNameValidator = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_.]+$/);

export const TokenNameSchema = z.string().min(1).max(100);

// Other

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
  data: _WebhookConnectionSchema,
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

export const WebhookActions = z.nativeEnum(EWebhookActions);

// Forms

export const HomeContactFormSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(50),
});

export const ProjectTokenCreateFormSchema = z.object({
  name: TokenNameSchema,
});
