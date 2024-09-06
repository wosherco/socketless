import * as Sentry from "@sentry/node";

/**
 * Function to wrap a promise and send any errors to Sentry.
 *
 * @param fn Function to wrap. Must be a promise and not return anything.
 * @returns Promise<boolean> Returns true if the function was successful, false if it errored.
 */
export function sentryWrapper(fn: () => Promise<void>): Promise<boolean> {
  return fn()
    .then(() => true)
    .catch((err) => {
      Sentry.captureException(err);

      return false;
    });
}
