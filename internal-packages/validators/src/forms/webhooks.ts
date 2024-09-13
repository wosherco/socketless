import { z } from "zod";

import { TokenNameSchema } from "..";

export const ProjectWebhookCreateFormSchema = z.object({
  name: TokenNameSchema,
  url: z.string().url().max(1000),
});
