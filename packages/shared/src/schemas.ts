import { z } from "zod";

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
