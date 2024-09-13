import { z } from "zod";

import { ProjectNameSchema } from "..";

export const CreateProjectSchema = z.object({
  name: ProjectNameSchema,
});
