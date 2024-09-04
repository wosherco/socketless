import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import { and, count, eq, not } from "@socketless/db";
import { projectTable } from "@socketless/db/schema";
import { CreateProjectSchema } from "@socketless/validators/forms";

import { createProject, getProjects, getProjectStats } from "../logic/project";
import { projectProcedure, protectedProcedure } from "../trpc";

export const projectRouter = {
  getProjects: protectedProcedure.query(
    async ({ ctx }) => await getProjects(ctx.db, ctx.user.id),
  ),

  getProject: projectProcedure.query(({ ctx }) => {
    return {
      id: ctx.project.id,
      name: ctx.project.name,
      clientId: ctx.project.clientId,
      plan: ctx.project.stripePlan,
      customerId: ctx.project.stripeCustomerId,
    };
  }),

  createProject: protectedProcedure
    .input(CreateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.transaction(async (tx) => {
        const [projects] = await tx
          .select({ count: count() })
          .from(projectTable)
          .where(
            and(
              eq(projectTable.ownerId, ctx.user.id),
              not(projectTable.deleted),
            ),
          );

        if (!projects || projects.count >= 3) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You can only have 3 projects",
          });
        }

        const project = await createProject(
          ctx.db,
          input.name,
          ctx.user.id,
          ctx.user.email,
        );

        return project;
      });

      ctx.posthog.capture({
        distinctId: ctx.user.id,
        event: "Project Create",
        properties: {
          projectId: project.id,
          name: project.name,
        },
      });

      return {
        id: project.id,
        name: project.name,
      };
    }),

  // deleteProject: protectedProcedure
  //   .input(
  //     z.object({
  //       projectId: z.number(),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) =>
  //     ctx.db.transaction(async (tx) => {
  //       const [project] = await tx
  //         .update(projectTable)
  //         .set({
  //           deleted: true,
  //         })
  //         .where(
  //           and(
  //             eq(projectTable.ownerId, ctx.user.id),
  //             eq(projectTable.id, input.projectId),
  //             not(projectTable.deleted),
  //           ),
  //         )
  //         .returning();

  //       if (!project) {
  //         throw new TRPCError({
  //           code: "NOT_FOUND",
  //           message: "Project not found",
  //         });
  //       }

  //       await ctx.kv.delete(getProjectTokenKVKey(project.clientSecret));

  //       if (project.stripeSubscriptionId) {
  //         const stripe = new Stripe(ctx.envsecrets.STRIPE_SECRET_KEY);
  //         await stripe.subscriptions.cancel(project.stripeSubscriptionId, {
  //           cancellation_details: {
  //             comment: "Project deleted",
  //           },
  //           invoice_now: true,
  //         });
  //       }
  //     }),
  //   ),

  stats: projectProcedure.query(async ({ ctx }) => {
    const usage = await getProjectStats(ctx.db, ctx.project.id);

    return usage;
  }),
} satisfies TRPCRouterRecord;
