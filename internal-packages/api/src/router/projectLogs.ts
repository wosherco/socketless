import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, asc, eq, inArray } from "@socketless/db";
import { LOG_ACTIONS, logsTable } from "@socketless/db/schema";
import { DATES } from "@socketless/validators";

import { projectProcedure } from "../trpc";

export const projectLogsRouter = {
  getLogs: projectProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        filter: z.array(z.enum(LOG_ACTIONS)).optional(),
        dateFilter: z.enum(DATES).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.filter !== undefined && input.filter.length > 0) {
        conditions.push(inArray(logsTable.action, input.filter));
      }

      if (input.dateFilter !== undefined) {
        switch (input.dateFilter) {
          case "last24":
        }
      }

      const logs = await ctx.db
        .select({
          action: logsTable.action,
          data: logsTable.data,
          timestamp: logsTable.timestamp,
        })
        .from(logsTable)
        .orderBy(asc(logsTable.timestamp))
        .where(and(eq(logsTable.projectId, ctx.project.id), ...conditions))
        .limit(input.limit)
        .offset(input.offset);

      return logs;
    }),
} satisfies TRPCRouterRecord;
