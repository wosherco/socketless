import * as Sentry from "@sentry/bun";

// import { nodeProfilingIntegration } from "@sentry/profiling-node";

import { env } from "../../env";

Sentry.init({
  dsn: env.MASTER_SENTRY_DSN,
  // integrations: [nodeProfilingIntegration()],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
});
