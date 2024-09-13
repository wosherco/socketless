import { cookies } from "next/headers";
import { generateState } from "arctic";

import { github } from "@socketless/auth/providers";

import { env } from "~/env";

export async function GET(_: Request): Promise<Response> {
  const state = generateState();

  const url = await github.createAuthorizationURL(state, {
    scopes: ["user:email", "read:user"],
  });

  cookies().set("github_state", state, {
    path: "/",
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return Response.redirect(url);
}
