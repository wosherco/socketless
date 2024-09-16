import { z } from "zod";

export const FeedNameValidator = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_.]+$/);

export type WebsocketMessage = string | Record<string, unknown> | unknown[];
