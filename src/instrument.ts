import * as Sentry from "@sentry/nextjs";

/**
 * Custom instrumentation logic.
 * Note: Next.js automatically looks for instrumentation.ts in the root or src/ directory.
 * If you want to use this file, you should import it in src/instrumentation.ts.
 */
export function initSentry() {
  if (process.env.NODE_ENV === "production") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
    });
  }
}
