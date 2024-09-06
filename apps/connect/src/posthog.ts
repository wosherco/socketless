import { PostHog } from "posthog-node";

import { env } from "../env";

export const posthog = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
  host: env.NEXT_PUBLIC_POSTHOG_HOST,
});

process.on("SIGTERM", () => {
  void posthog.shutdown().then(() => console.log("PostHog shutdown"));
});
