import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import { z } from "zod";

import { and, count, eq, not } from "@socketless/db";
import { projectTable } from "@socketless/db/schema";
import { CreateProjectSchema } from "@socketless/validators";

import { protectedProcedure } from "../trpc";
import { generateClientSecret } from "../utils";

export const projectRouter = {
  getProjects: protectedProcedure.query(
    async ({ ctx }) =>
      await ctx.db
        .select({ id: projectTable.id, name: projectTable.name })
        .from(projectTable)
        .where(
          and(eq(projectTable.ownerId, ctx.user.id), not(projectTable.deleted)),
        ),
  ),

  getProject: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        includeSecret: z.boolean().default(false),
        includeConfig: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [project] = await ctx.db
        .select({
          id: projectTable.id,
          name: projectTable.name,
          clientId: projectTable.clientId,
          plan: projectTable.stripePlan,
          customerId: projectTable.stripeCustomerId,
          ...(input.includeSecret
            ? {
                clientSecret: projectTable.clientSecret,
              }
            : {}),
          ...(input.includeConfig
            ? {
                config: projectTable.config,
              }
            : {}),
        })
        .from(projectTable)
        .where(
          and(
            eq(projectTable.ownerId, ctx.user.id),
            eq(projectTable.id, input.projectId),
            not(projectTable.deleted),
          ),
        );

      return project;
    }),

  resetClientSecret: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [proj] = await ctx.db
        .select()
        .from(projectTable)
        .where(
          and(
            eq(projectTable.ownerId, ctx.user.id),
            eq(projectTable.id, input.projectId),
            not(projectTable.deleted),
          ),
        );

      if (!proj) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const [newProj] = await ctx.db
        .update(projectTable)
        .set({
          clientSecret: generateClientSecret(),
        })
        .where(
          and(
            eq(projectTable.ownerId, ctx.user.id),
            eq(projectTable.id, input.projectId),
            not(projectTable.deleted),
          ),
        )
        .returning({
          clientSecret: projectTable.clientSecret,
        });

      if (!newProj) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return newProj;
    }),

  createProject: protectedProcedure
    .input(CreateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      // TODO: Temp disable of project creation
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Project creation is disabled",
      });

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

        const clientId = `wskl_live_${nanoid(21)}`;

        const stripe = new Stripe(ctx.envsecrets.STRIPE_SECRET_KEY);

        const stripeCustomer = await stripe.customers.create({
          metadata: {
            clientId,
          },
          email: ctx.user.email,
        });

        try {
          const [project] = await tx
            .insert(projectTable)
            .values({
              name: input.name,
              clientId: clientId,
              clientSecret: generateClientSecret(),
              stripeCustomerId: stripeCustomer.id,
              ownerId: ctx.user.id,
            })
            .returning();

          if (!project) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
            });
          }

          // // Initializing kv values
          // await ctx.kv.put(
          //   getProjectTokenKVKey(project.clientSecret),
          //   project.clientId,
          // );
          // await ctx.kv.put(
          //   getProjectStripeCustomerKVKey(project.clientId),
          //   stripeCustomer.id,
          // );

          // // Initializing DO
          // const doid = ctx.doProject.idFromName(
          //   getDOProjectKey(project.clientId),
          // );
          // const stub = ctx.doProject.get(doid);
          // await stub.setup(project.id, project.clientId);

          return project;
        } catch (e) {
          await stripe.customers.del(stripeCustomer.id);
          // try {
          //   await ctx.kv.delete(getProjectTokenKVKey(project.clientSecret));
          // } catch (e) {
          //   // Key might not exist
          // }
          // try {
          //   await ctx.kv.delete(
          //     getProjectStripeCustomerKVKey(project.clientId),
          //   );
          // } catch (e) {
          //   // Key might not exist
          // }
          throw e;
        }
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
} satisfies TRPCRouterRecord;
