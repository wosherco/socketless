import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../env";
import * as schema from "./schema";

export const db = drizzle(postgres(env.POSTGRES_URL), { schema });

export type DBType = typeof db;
