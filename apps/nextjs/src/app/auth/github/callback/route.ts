import { cookies } from "next/headers";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { z } from "zod";

import { lucia } from "@socketless/auth";
import { github } from "@socketless/auth/providers";
import { and, eq } from "@socketless/db";
import { db } from "@socketless/db/client";
import { oauthAccountTable, userTable } from "@socketless/db/schema";

import { env } from "~/env";
import PostHogClient from "~/server/posthog";

// TODO: Maybe update avatar and username?
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies().get("github_state")?.value ?? null;

  if (
    code == null ||
    state == null ||
    storedState == null ||
    state !== storedState
  ) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);

    const [githubUserResponse, githubEmailResponse] = await Promise.all([
      fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }),
      fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }),
    ]);

    const [githubUser, githubEmails] = await Promise.all([
      githubUserResponse
        .json()
        .then((data) => GithubUserSchema.parseAsync(data)),
      githubEmailResponse
        .json()
        .then((data) => GithubEmailsSchema.parseAsync(data)),
    ]);

    const email = githubEmails.find((e) => e.primary)?.email;

    if (email == null) {
      // Redirecting to auth page
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/auth?error=EMAIL",
        },
      });
    }

    // Replace this with your own DB client.
    const [existingUser] = await db
      .select()
      .from(oauthAccountTable)
      .where(
        and(
          eq(oauthAccountTable.providerId, "github"),
          eq(oauthAccountTable.providerUserId, `${githubUser.id}`),
        ),
      );

    if (existingUser) {
      const session = await lucia.createSession(existingUser.userId, {});

      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/dashboard",
        },
      });
    }

    const userId = generateIdFromEntropySize(10); // 16 characters long

    // Replace this with your own DB client.
    await db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id: userId,
        email: email.toLowerCase(),
        username: githubUser.login,
        profilePicture: githubUser.avatar_url,
      });
      await tx.insert(oauthAccountTable).values({
        providerId: "github",
        providerUserId: `${githubUser.id}`,
        userId,
      });
    });

    PostHogClient().capture({
      distinctId: userId,
      event: "User Signed Up",
      properties: {
        email,
        username: githubUser.login,
      },
    });

    const session = await lucia.createSession(userId, {});

    const sessionCookie = lucia.createSessionCookie(session.id);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/dashboard",
      },
    });
  } catch (e) {
    // the specific error message depends on the provider

    if (env.NODE_ENV === "development") {
      console.error(e);
    }

    if (e instanceof OAuth2RequestError) {
      // invalid code
      return new Response(null, {
        status: 400,
      });
    }
    return new Response(null, {
      status: 500,
    });
  }
}

const GithubUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string(),
});

const GithubEmailsSchema = z.array(
  z.object({
    email: z.string(),
    primary: z.boolean(),
    verified: z.boolean(),
  }),
);
