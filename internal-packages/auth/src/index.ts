import type { Session, User } from "lucia";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { Lucia } from "lucia";

import type { DBType } from "@socketless/db";
import { sessionTable, userTable } from "@socketless/db/schema";

import { env } from "../env";

export { User, Session };

const adaptercustom = (db: DBType) =>
  new DrizzlePostgreSQLAdapter(db, sessionTable, userTable); // your adapter

type LuciaType = Lucia<Record<never, never>, DatabaseUserAttributes>;

export const luciacustom = (db: DBType) =>
  new Lucia(adaptercustom(db), {
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
        githubId: attributes.githubId,
        profilePicture: attributes.profilePicture,
      };
    },
  });

// IMPORTANT!
declare module "lucia" {
  interface Register {
    Lucia: LuciaType;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  email: string;
  githubId: string;
  username: string;
  profilePicture?: string;
}

export const validateRawRequest = async (
  db: DBType,
  authorizationHeader?: string | null,
  authorizationCookie?: string | null,
) => {
  const luciainst = luciacustom(db);

  let sessionId = luciainst.readBearerToken(authorizationHeader ?? "");

  if (!sessionId || sessionId == "null") {
    sessionId = authorizationCookie ?? null;
  }

  if (!sessionId) {
    return {
      user: null,
      session: null,
    };
  }

  const result = await luciainst.validateSession(sessionId);

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
