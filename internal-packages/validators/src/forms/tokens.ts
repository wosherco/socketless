import { z } from "zod";

import { TokenNameSchema } from "..";

export const ProjectTokenCreateFormSchema = z.object({
  name: TokenNameSchema,
});
