import { cookies } from "next/headers";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { z } from "zod";

import { github } from "@socketless/auth/providers";
import { eq } from "@socketless/db";
import { userTable } from "@socketless/db/schema";

import { env } from "~/env";
import { lucia } from "~/server/auth";
import { db } from "~/server/db";
import PostHogClient from "~/server/posthog";

// TODO: Maybe update avatar and username?
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies().get("github_state")?.value ?? null;

  if (!code || !state || !storedState || state !== storedState) {
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

    const [rawGithub, rawGithubEmail] = await Promise.all([
      githubUserResponse.json(),
      githubEmailResponse.json(),
    ]);

    const [githubUser, githubEmails] = await Promise.all([
      GithubUserSchema.parseAsync(rawGithub),
      GithubEmailsSchema.parseAsync(rawGithubEmail),
    ]);

    const email = githubEmails.find((e) => e.primary)?.email;

    if (!email) {
      // Redirecting to auth page
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/auth?error=EMAIL",
        },
      });
    }

    // Replace this with your own DB client.
    const [existingUser] = await db()
      .select()
      .from(userTable)
      .where(eq(userTable.githubId, githubUser.id));

    if (existingUser) {
      const session = await lucia().createSession(existingUser.id, {});

      const sessionCookie = lucia().createSessionCookie(session.id);
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
    await db().insert(userTable).values({
      id: userId,
      email: email.toLowerCase(),
      username: githubUser.login,
      githubId: githubUser.id,
      profilePicture: githubUser.avatar_url,
    });

    PostHogClient().capture({
      distinctId: userId,
      event: "User Signed Up",
      properties: {
        email,
        username: githubUser.login,
      },
    });

    const session = await lucia().createSession(userId, {});

    const sessionCookie = lucia().createSessionCookie(session.id);

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
