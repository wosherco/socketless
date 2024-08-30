import { z } from "zod";

// Fields

export const ChannelNameValidator = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[-.a-zA-Z0-9]+$/);

// Other

const _WebhookConnectionSchema = z.object({
  projectId: z.number(),
  projectClientId: z.string(),
  channel: z.string(),
  identifier: z.string(),
  data: z.string().optional(),
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
    code: z.number(),
    reason: z.string(),
    clean: z.boolean(),
  }),
});

export const WebhookPayloadSchema = z.union([
  WebhookConnectSchema,
  WebhookMessageSchema,
  WebhookCloseSchema,
]);

export const MessagePrivacyLevel = z.enum(["ALWAYS", "ONLY-ERRORS", "NONE"]);
export const WebhookActions = z.nativeEnum(EWebhookActions);

export const ProjectConfigSchema = z.object({
  webhookUrl: z.string().url().nullable(),
  webhookSecret: z.string(),
  webhookEvents: z.array(WebhookActions).max(3),
  messagePrivacyLevel: MessagePrivacyLevel.default("ALWAYS"),
});

export type ProjectConfigType = z.infer<typeof ProjectConfigSchema>;

export const ProjectEdgeLimitsSchema = z.object({
  connectionsLimited: z.coerce.boolean(),
  connectionsLimit: z.coerce.number(),
  connectionsPerChannelLimit: z.coerce.number(),
  peakConnectionsLimited: z.coerce.boolean(),
  peakConnectionsLimit: z.coerce.number(),
  outgoingMessagesLimited: z.coerce.boolean(),
  outgoingMessagesLimit: z.coerce.number(),
  incomingMessagesLimited: z.coerce.boolean(),
  incomingMessagesLimit: z.coerce.number(),
});

export type LimitsType = z.infer<typeof ProjectEdgeLimitsSchema>;

export const ConnectionDataSchema = z.object({
  connectionId: z.number(),
  connectionIdentifier: z.string(),
  clientId: z.number(),
  feed: z.string(),
  projectId: z.number(),
  data: z.string().optional(),
});

export type ConnectionDataType = z.infer<typeof ConnectionDataSchema>;

// Forms

export const HomeContactFormSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(50),
});

export const ProjectConfigWebhookFormSchema = z.object({
  projectId: z.number(),
  webhookUrl: z.string().url().nullable(),
  events: z.array(WebhookActions).max(3),
});

export const ProjectConfigPrivacyFormSchema = z.object({
  projectId: z.number(),
  level: MessagePrivacyLevel,
});

export const ProjectEdgeLimitsFormSchema = z
  .object({
    projectId: z.number(),
  })
  .and(ProjectEdgeLimitsSchema);
