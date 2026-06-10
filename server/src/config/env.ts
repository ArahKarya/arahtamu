import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  APP_URL: z.string().url().default('http://localhost:3001'),
  CORS_ORIGIN: z
    .string()
    .min(1, 'CORS_ORIGIN required, e.g. http://localhost:5173,https://app.example.com')
    .default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Bcrypt rounds — 12 default (modern standard); raise to 13 for high-value targets.
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),

  // Auth flow toggles
  ALLOW_GOOGLE_SIGNIN: z.coerce.boolean().default(false),
  GOOGLE_CLIENT_ID: z.string().optional(),

  UPLOAD_DIR: z.string().default('./uploads'),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().default(10),

  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  BULL_BOARD_PATH: z.string().default('/admin/queues'),

  SEED_ADMIN_EMAIL: z.string().email().default('admin@arahtamu.local'),
  SEED_ADMIN_PASSWORD: z.string().default('admin123'),

  // Optional integrations — enabled by presence of secret
  SENTRY_DSN: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('ArahTamu <noreply@arahtamu.local>'),
  EMAIL_REPLY_TO: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[env] Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
