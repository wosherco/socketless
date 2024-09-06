import * as Sentry from "@sentry/node";

// import { nodeProfilingIntegration } from "@sentry/profiling-node";

import { env } from "../../env";

Sentry.init({
  dsn: env.CONNECT_SENTRY_DSN,
  // integrations: [nodeProfilingIntegration()],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
