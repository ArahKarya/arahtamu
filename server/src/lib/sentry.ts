import * as Sentry from '@sentry/node';
import { env, isProduction } from '../config/env.js';
import { logger } from './logger.js';

let initialized = false;

/** Initialize Sentry if SENTRY_DSN env is set. No-op otherwise (dev-friendly). */
export function initSentry(): void {
  if (initialized) return;
  if (!env.SENTRY_DSN) {
    logger.info('[sentry] SENTRY_DSN not set, error reporting disabled');
    return;
  }
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    // Auto-capture HTTP/Express integrations are loaded by default in @sentry/node v10+.
  });
  initialized = true;
  logger.info('[sentry] initialized');
}

export { Sentry };
