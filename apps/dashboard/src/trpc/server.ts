import { cache } from "react";
import { headers } from "next/headers";
import { createHydrationHelpers } from "@trpc/react-query/rsc";

import type { AppRouter } from "@socketless/api";
import { createCaller, createTRPCContext } from "@socketless/api";

import { validateRequest } from "~/server/auth";
import PostHogClient from "~/server/posthog";
import { createQueryClient } from "./query-client";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  const { user, session } = await validateRequest();

  return createTRPCContext({
    posthog: PostHogClient(),
    headers: heads,
    user,
    session,
  });
});

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);