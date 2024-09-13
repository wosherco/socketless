import { z } from "zod";

export const HomeContactFormSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
});
