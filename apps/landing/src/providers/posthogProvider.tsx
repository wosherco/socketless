// app/providers.tsx
"use client";

import { useEffect } from "react";
import { skipToken } from "@tanstack/react-query";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

import { env } from "~/env";
import { api } from "~/trpc/react";

if (typeof window !== "undefined") {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    capture_pageleave: true, // Enable automatic pageleave capture
  });
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  const user = api.auth.getUser.useQuery(skipToken, {});

  useEffect(() => {
    if (user.isFetched && user.data) {
      posthog.identify(user.data.id, {
        email: user.data.email,
        username: user.data.username,
      });
    }
  }, [user]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
