"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { lucia } from "@socketless/auth";

import { validateRequest } from "~/server/auth";

export const logoutAction = async () => {
  const { session } = await validateRequest();

  if (session) {
    await lucia.invalidateSession(session.id);
    const sessionCookie = lucia.createBlankSessionCookie();
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
    redirect("/");
  }
};
