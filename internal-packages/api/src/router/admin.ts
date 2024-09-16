import type { TRPCRouterRecord } from "@trpc/server";

import { count } from "@socketless/db";
import { connectedClientsTable } from "@socketless/db/schema";

import { adminProcedure } from "../trpc";

export const adminRouter = {
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [concurrentConnections] = await ctx.db
      .select({ count: count() })
      .from(connectedClientsTable);

    return {
      concurrentConnections: concurrentConnections?.count ?? -1,
    };
  }),
} satisfies TRPCRouterRecord;
