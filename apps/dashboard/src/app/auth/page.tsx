import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { validateRequest } from "~/server/auth";
import SignIn from "./_components/SignInCard";

export const metadata: Metadata = {
  title: "Login",
};

export default async function Page() {
  const { user } = await validateRequest();

  if (user) {
    return permanentRedirect("/");
  }

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <SignIn />
    </div>
  );
}
