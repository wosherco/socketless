import { z } from "zod";

export const RoomNameValidator = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_.]+$/);
