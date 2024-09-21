import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";

import type { Session, User } from "@socketless/auth";
import { lucia } from "@socketless/auth";

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    let sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (sessionId == null) {
      sessionId = lucia.readBearerToken(headers().get("Authorization") ?? "");
    }

    if (sessionId == null) {
      return {
        user: null,
        session: null,
      };
    }

    const result = await lucia.validateSession(sessionId);
    // next.js throws when you attempt to set cookie when rendering page
    try {
      if (result.session?.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
    } catch {
      // Nothing
    }
    return result;
  },
);
