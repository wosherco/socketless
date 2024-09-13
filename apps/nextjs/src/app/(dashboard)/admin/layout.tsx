import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { validateRequest } from "~/server/auth";

export default async function AdminLayour({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await validateRequest();

  console.log(user);

  if (!user || user.role !== "ADMIN") {
    notFound();
  }

  return children;
}
