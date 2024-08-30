import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";

import { and, eq, not } from "@socketless/db";
import { projectTable } from "@socketless/db/schema";
import {
  ProjectConfigPrivacyFormSchema,
  ProjectConfigWebhookFormSchema,
} from "@socketless/validators";

import { protectedProcedure } from "../trpc";

export const projectSettingsRouter = {
  rotateWebhookSecret: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [project] = await ctx.db
        .select()
        .from(projectTable)
        .where(
          and(
            eq(projectTable.ownerId, ctx.user.id),
            eq(projectTable.id, input.projectId),
            not(projectTable.deleted),
          ),
        );

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const newSecret = nanoid(40);

      await ctx.db.update(projectTable).set({
        config: {
          ...project.config,
          webhookSecret: newSecret,
        },
      });

      return {
        secret: newSecret,
      };
    }),

  setWebhookUrl: protectedProcedure
    .input(ProjectConfigWebhookFormSchema)
    .mutation(async ({ ctx, input }) => {
      const [project] = await ctx.db
        .select()
        .from(projectTable)
        .where(
          and(
            eq(projectTable.ownerId, ctx.user.id),
            eq(projectTable.id, input.projectId),
            not(projectTable.deleted),
          ),
        );

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      await ctx.db.update(projectTable).set({
        config: {
          ...project.config,
          webhookUrl: input.webhookUrl,
          webhookEvents: input.events,
        },
      });

      return {
        webhookUrl: input.webhookUrl,
        webhookEvents: input.events,
      };
    }),

  setMessagePrivacyLevel: protectedProcedure
    .input(ProjectConfigPrivacyFormSchema)
    .mutation(async ({ ctx, input }) => {
      const [project] = await ctx.db
        .select()
        .from(projectTable)
        .where(
          and(
            eq(projectTable.ownerId, ctx.user.id),
            eq(projectTable.id, input.projectId),
            not(projectTable.deleted),
          ),
        );

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      await ctx.db.update(projectTable).set({
        config: {
          ...project.config,
          messagePrivacyLevel: input.level,
        },
      });

      return {
        messagePrivacyLevel: input.level,
      };
    }),
} satisfies TRPCRouterRecord;
