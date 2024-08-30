import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { count, eq } from "@socketless/db";
import { db } from "@socketless/db/client";
import { projectWebhookTable } from "@socketless/db/schema";

import {
  createProjectWebhook,
  deleteProjectWebhook,
  getProjectWebhook,
  getProjectWebhooks,
  rotateProjectWebhookSecret,
  updateProjectWebhookUrl,
} from "../logic/projectWebhook";
import { projectProcedure } from "../trpc";

const urlSchema = z.string().url().max(1000);

export const projectTokenRouter = {
  createWebhook: projectProcedure
    .input(z.object({ url: urlSchema }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await db.transaction(async (tx) => {
        const [webhooksNum] = await tx
          .select({ count: count() })
          .from(projectWebhookTable)
          .where(eq(projectWebhookTable.projectId, ctx.project.id));

        if (!webhooksNum) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (webhooksNum.count >= 4) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const webhook = await createProjectWebhook(
          tx,
          ctx.project.id,
          input.url,
        );

        if (!webhook) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }

        return webhook;
      });

      return webhook;
    }),

  getWebhooks: projectProcedure.query(async ({ ctx }) => {
    const webhooks = await getProjectWebhooks(db, ctx.project.id);

    return webhooks.map((w) => ({
      id: w.id,
      url: w.url,
      secret: w.secret,
      sendOnConnect: w.sendOnConnect,
      sendOnMessage: w.sendOnMessage,
      sendOnDisconnect: w.sendOnDisconnect,
    }));
  }),

  rotateSecret: projectProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await getProjectWebhook(db, input.webhookId);

      if (!webhook || webhook.projectId !== ctx.project.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const newSecret = await rotateProjectWebhookSecret(db, webhook.id);

      return newSecret;
    }),

  updateUrl: projectProcedure
    .input(z.object({ webhookId: z.number(), url: urlSchema }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await getProjectWebhook(db, input.webhookId);

      if (!webhook || webhook.projectId !== ctx.project.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const newSecret = await updateProjectWebhookUrl(
        db,
        webhook.id,
        input.url,
      );

      return newSecret;
    }),

  deleteToken: projectProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const webhook = await getProjectWebhook(db, input.webhookId);

      if (!webhook || webhook.projectId !== ctx.project.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await deleteProjectWebhook(db, webhook.id);
    }),
} satisfies TRPCRouterRecord;
