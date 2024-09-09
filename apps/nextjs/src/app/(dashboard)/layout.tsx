import type { Metadata } from "next";
import type * as React from "react";
import { permanentRedirect } from "next/navigation";

import { validateRequest } from "~/server/auth";

export const metadata: Metadata = {
  title: {
    absolute: "Dashboard | Socketless",
    template: "%s | Dashboard Socketless",
  },
  robots: {
    follow: false,
    index: false,
  },
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();

  if (!user) {
    return permanentRedirect("/auth");
  }

  return <div className="py-4">{children}</div>;
}
