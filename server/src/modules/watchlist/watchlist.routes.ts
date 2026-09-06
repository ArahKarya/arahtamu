import { Router } from 'express';
import { ok, paginationQuerySchema } from '@fdm/shared';
import { authenticate } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { validate, getValidated } from '../../middleware/validate.js';
import { createWatchlistSchema, updateWatchlistSchema } from '@fdm/shared';
import type { CreateWatchlistInput, UpdateWatchlistInput, PaginationQuery } from '@fdm/shared';
import * as svc from './watchlist.service.js';

export const watchlistRouter = Router();

watchlistRouter.use(authenticate);

watchlistRouter.get(
  '/',
  requirePermissions('watchlist:read'),
  validate(paginationQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const q = getValidated<PaginationQuery>(req, 'query');
      const result = await svc.list(q);
      res.json(ok(result.items, result.meta));
    } catch (err) {
      next(err);
    }
  },
);

watchlistRouter.get(
  '/:id',
  requirePermissions('watchlist:read'),
  async (req, res, next) => {
    try {
      res.json(ok(await svc.get(String(req.params.id))));
    } catch (err) {
      next(err);
    }
  },
);

watchlistRouter.post(
  '/',
  requirePermissions('watchlist:write'),
  validate(createWatchlistSchema),
  audit('CREATE', 'watchlist'),
  async (req, res, next) => {
    try {
      const input = getValidated<CreateWatchlistInput>(req);
      res.status(201).json(ok(await svc.create(input)));
    } catch (err) {
      next(err);
    }
  },
);

watchlistRouter.patch(
  '/:id',
  requirePermissions('watchlist:write'),
  validate(updateWatchlistSchema),
  audit('UPDATE', 'watchlist'),
  async (req, res, next) => {
    try {
      const input = getValidated<UpdateWatchlistInput>(req);
      res.json(ok(await svc.update(String(req.params.id), input)));
    } catch (err) {
      next(err);
    }
  },
);

watchlistRouter.delete(
  '/:id',
  requirePermissions('watchlist:delete'),
  audit('DELETE', 'watchlist'),
  async (req, res, next) => {
    try {
      await svc.remove(String(req.params.id));
      res.json(ok({ deleted: true }));
    } catch (err) {
      next(err);
    }
  },
);
