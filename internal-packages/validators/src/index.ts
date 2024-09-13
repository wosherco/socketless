import { z } from "zod";

// Fields

export const TokenNameSchema = z.string().min(1).max(100);
export const ProjectNameSchema = z.string().min(1).max(100);

export const DATES = [
  "last24",
  "today",
  "yesterday",
  "last7",
  "last30",
] as const;
export type DateLogsFilter = (typeof DATES)[number];
