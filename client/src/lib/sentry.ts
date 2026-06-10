import * as Sentry from '@sentry/react';

let initialized = false;

/**
 * Initialize Sentry on the client. Reads `VITE_SENTRY_DSN` from the build-time env
 * (Vite static-replaces this at build time). No-op when DSN is unset.
 *
 * Call once from `main.tsx` BEFORE rendering the app.
 */
export function initSentry(): void {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
  });
  initialized = true;
}

export { Sentry };
