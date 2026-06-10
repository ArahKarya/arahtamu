import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
// pino-http v10 ships CJS with no explicit default export in .d.ts; cast for NodeNext interop.
import pinoHttpModule from 'pino-http';
const pinoHttp = pinoHttpModule as unknown as (opts?: { logger: typeof logger }) => import('express').RequestHandler;
import { env, isProduction } from './config/env.js';
import { logger } from './lib/logger.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { createBullBoardRouter } from './services/bullBoard.js';
import { authenticate } from './middleware/auth.js';
import { requireRoles } from './middleware/rbac.js';
import { ROLES } from '@arahtamu/shared';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Helmet — relax COOP/CSP only when Google Sign-In is enabled (popup flow needs same-origin-allow-popups
  // + accounts.google.com in connect/script/frame-src). Past incidents: HRIS & Panggon Mikir blocked GSI
  // login until these were added. Keep CSP fully off in dev for HMR/Vite ergonomics.
  const gsiEnabled = env.ALLOW_GOOGLE_SIGNIN;
  app.use(
    helmet({
      contentSecurityPolicy: !isProduction
        ? false
        : {
            useDefaults: true,
            directives: {
              'default-src': ["'self'"],
              'script-src': [
                "'self'",
                "'unsafe-inline'",
                ...(gsiEnabled ? ['https://accounts.google.com', 'https://apis.google.com'] : []),
              ],
              'connect-src': [
                "'self'",
                ...(gsiEnabled ? ['https://accounts.google.com'] : []),
              ],
              'frame-src': [
                "'self'",
                ...(gsiEnabled ? ['https://accounts.google.com'] : []),
              ],
              'img-src': ["'self'", 'data:', 'blob:', 'https:'],
              'style-src': ["'self'", "'unsafe-inline'"],
              'font-src': ["'self'", 'data:'],
              'object-src': ["'none'"],
              'base-uri': ["'self'"],
              'form-action': ["'self'"],
              'frame-ancestors': ["'none'"],
              'upgrade-insecure-requests': [],
            },
          },
      crossOriginOpenerPolicy: gsiEnabled
        ? { policy: 'same-origin-allow-popups' }
        : { policy: 'same-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Bull Board — admin only
  app.use(
    env.BULL_BOARD_PATH,
    authenticate,
    requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
    createBullBoardRouter(env.BULL_BOARD_PATH),
  );

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
