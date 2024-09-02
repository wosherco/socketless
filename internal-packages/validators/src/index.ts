import { z } from "zod";

// Fields

export const TokenNameSchema = z.string().min(1).max(100);
export const ProjectNameSchema = z.string().min(1).max(100);
