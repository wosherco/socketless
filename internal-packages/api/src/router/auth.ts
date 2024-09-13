import type { TRPCRouterRecord } from "@trpc/server";

import { protectedProcedure } from "../trpc";

export const authRouter = {
  getUser: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      username: ctx.user.username,
      role: ctx.user.role,
    };
  }),

  // logout: protectedProcedure.query(async ({ ctx }) => {
  //   const lucia = luciacustom(ctx.db);
  //   await lucia.invalidateSession(ctx.session.id);
  //   const sessionCookie = lucia.createBlankSessionCookie();

  //   setCookie(
  //     ctx.resHeaders,
  //     sessionCookie.name,
  //     sessionCookie.value,
  //     sessionCookie.attributes,
  //   );
  // }),
} satisfies TRPCRouterRecord;
