import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ok } from '@arahtamu/shared';
import {
  changePasswordSchema,
  loginSchema,
  refreshTokenSchema,
} from '@arahtamu/shared';
import { validate, getValidated } from '../../middleware/validate.js';
import { authenticate, type AuthenticatedRequest } from '../../middleware/auth.js';
import * as authService from './auth.service.js';

export const authRouter = Router();

// Brute-force protection: 5 login attempts per 15 min, keyed by email + IP.
// Refresh limited per IP because email is not in the body.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${(req.body?.email ?? '').toLowerCase()}|${req.ip ?? ''}`,
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Terlalu banyak percobaan login, coba lagi 15 menit lagi' },
  },
});
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
const changePasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const input = getValidated<import('@arahtamu/shared').LoginInput>(req);
    const result = await authService.login(
      input,
      req.ip ?? null,
      req.headers['user-agent'] ?? null,
    );
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', refreshLimiter, validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const { refreshToken } = getValidated<{ refreshToken: string }>(req);
    const result = await authService.refresh(
      refreshToken,
      req.ip ?? null,
      req.headers['user-agent'] ?? null,
    );
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const { refreshToken } = getValidated<{ refreshToken: string }>(req);
    await authService.logout(refreshToken);
    res.json(ok({ loggedOut: true }));
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await authService.me(req.user!.id);
    res.json(ok(user));
  } catch (err) {
    next(err);
  }
});

authRouter.post(
  '/change-password',
  authenticate,
  changePasswordLimiter,
  validate(changePasswordSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const input = getValidated<import('@arahtamu/shared').ChangePasswordInput>(req);
      await authService.changePassword(req.user!.id, input.currentPassword, input.newPassword);
      res.json(ok({ changed: true }));
    } catch (err) {
      next(err);
    }
  },
);
