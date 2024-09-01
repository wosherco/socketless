import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { db } from "@socketless/db/client";
import { ProjectTokenCreateFormSchema } from "@socketless/validators/forms";

import {
  createProjectToken,
  deleteProjectToken,
  getProjectToken,
  getProjectTokens,
  rotateProjectToken,
} from "../logic/projectToken";
import { projectProcedure } from "../trpc";

export const projectTokenRouter = {
  createToken: projectProcedure
    .input(ProjectTokenCreateFormSchema)
    .mutation(async ({ ctx, input }) => {
      const newToken = await createProjectToken(db, ctx.project.id, input.name);

      return newToken;
    }),

  getTokens: projectProcedure.query(async ({ ctx }) => {
    const tokens = await getProjectTokens(db, ctx.project.id);

    return tokens.map((t) => ({
      id: t.id,
      token: t.token,
      name: t.name,
    }));
  }),

  rotateToken: projectProcedure
    .input(z.object({ tokenId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const token = await getProjectToken(db, input.tokenId);

      if (!token || token.projectId !== ctx.project.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const newToken = await rotateProjectToken(db, input.tokenId);

      return newToken;
    }),

  deleteToken: projectProcedure
    .input(z.object({ tokenId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const token = await getProjectToken(db, input.tokenId);

      if (!token || token.projectId !== ctx.project.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await deleteProjectToken(db, input.tokenId);
    }),
} satisfies TRPCRouterRecord;
