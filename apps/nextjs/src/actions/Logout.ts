"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { lucia, validateRequest } from "~/server/auth";

export const logoutAction = async () => {
  const { session } = await validateRequest();

  if (session) {
    const l = lucia();
    await l.invalidateSession(session.id);
    const sessionCookie = l.createBlankSessionCookie();
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
    redirect("/");
  }
};
