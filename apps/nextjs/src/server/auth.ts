import { cache } from "react";
import { cookies, headers } from "next/headers";

import type { Session, User } from "@socketless/auth";
import { luciacustom } from "@socketless/auth";

import { db } from "./db";

export const lucia = () => luciacustom(db());

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const luciainst = lucia();
    let sessionId = cookies().get(luciainst.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      sessionId = luciainst.readBearerToken(
        headers().get("Authorization") ?? "",
      );
    }

    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    const result = await luciainst.validateSession(sessionId);
    // next.js throws when you attempt to set cookie when rendering page
    try {
      if (result.session?.fresh) {
        const sessionCookie = luciainst.createSessionCookie(result.session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
      if (!result.session) {
        const sessionCookie = luciainst.createBlankSessionCookie();
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
