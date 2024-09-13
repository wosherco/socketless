import type { Session, User } from "lucia";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { Lucia } from "lucia";

import type { Role } from "@socketless/db/schema";
import { db } from "@socketless/db/client";
import { sessionTable, userTable } from "@socketless/db/schema";

import { env } from "../env";

export { User, Session };

type LuciaType = Lucia<Record<never, never>, DatabaseUserAttributes>;

export const lucia = new Lucia(
  new DrizzlePostgreSQLAdapter(db, sessionTable, userTable),
  {
    sessionCookie: {
      // this sets cookies with super long expiration
      // since Next.js doesn't allow Lucia to extend cookie expiration when rendering pages
      expires: false,
      attributes: {
        // set to `true` when using HTTPS
        secure: env.NODE_ENV === "production",
      },
    },
    getUserAttributes: (attributes) => {
      return {
        // attributes has the type of DatabaseUserAttributes
        email: attributes.email,
        username: attributes.username,
        profilePicture: attributes.profilePicture,
        role: attributes.role,
      };
    },
  },
);

// IMPORTANT!
declare module "lucia" {
  interface Register {
    Lucia: LuciaType;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  email: string;
  username: string;
  profilePicture?: string;
  role: Role;
}

export const validateRawRequest = async (
  authorizationHeader?: string | null,
  authorizationCookie?: string | null,
) => {
  let sessionId = lucia.readBearerToken(authorizationHeader ?? "");

  if (sessionId == null || sessionId == "null") {
    sessionId = authorizationCookie ?? null;
  }

  if (sessionId == null) {
    return {
      user: null,
      session: null,
    };
  }

  const result = await lucia.validateSession(sessionId);

  // TODO: Refresh session id
  // // next.js throws when you attempt to set cookie when rendering page
  // try {
  //   if (result.session?.fresh) {
  //     const sessionCookie = luciainst.createSessionCookie(result.session.id);
  //     cookies().set(
  //       sessionCookie.name,
  //       sessionCookie.value,
  //       sessionCookie.attributes,
  //     );
  //   }
  //   if (!result.session) {
  //     const sessionCookie = luciainst.createBlankSessionCookie();
  //     cookies().set(
  //       sessionCookie.name,
  //       sessionCookie.value,
  //       sessionCookie.attributes,
  //     );
  //   }
  // } catch {
  //   // Nothing
  // }

  return result;
};
