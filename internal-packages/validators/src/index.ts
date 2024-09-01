import { z } from "zod";

// Fields

export const RoomNameValidator = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_.]+$/);

export const TokenNameSchema = z.string().min(1).max(100);
export const ProjectNameSchema = z.string().min(1).max(100);
