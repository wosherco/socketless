import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import { HomeContactFormSchema } from "@socketless/validators/forms";

import { env } from "../../env";
import { publicProcedure } from "../trpc";

export const homeRouter = {
  contact: publicProcedure
    .input(HomeContactFormSchema)
    .mutation(async ({ ctx, input }) => {
      if (env.CONTACT_FORM_WEBHOOK == null) {
        throw new TRPCError({
          code: "NOT_IMPLEMENTED",
        });
      }

      const data = {
        ip: ctx.headers.get("CF-Connecting-IP"),
        ua: ctx.headers.get("User-Agent"),
        name: input.name,
        email: input.email,
        message: input.message,
        username: ctx.user?.username,
        userId: ctx.user?.id,
      };

      const req = await fetch(env.CONTACT_FORM_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return {
        success: req.ok,
      };
    }),
} satisfies TRPCRouterRecord;
