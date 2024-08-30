import { dbclient } from "@socketless/db/client";

import { env } from "~/env";

export const db = () => {
  return dbclient(env.DRIZZLE_DATABASE_URL);
};
