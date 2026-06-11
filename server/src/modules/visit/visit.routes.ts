import { Router } from 'express';
import { ok, paginationQuerySchema } from '@arahtamu/shared';
import { authenticate, type AuthenticatedRequest } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { validate, getValidated } from '../../middleware/validate.js';
import {
  createVisitSchema,
  updateVisitSchema,
  checkInSchema,
  confirmVisitSchema,
} from '@arahtamu/shared';
import type {
  CreateVisitInput,
  UpdateVisitInput,
  CheckInInput,
  ConfirmVisitInput,
  PaginationQuery,
} from '@arahtamu/shared';
import * as svc from './visit.service.js';

export const visitRouter = Router();

visitRouter.use(authenticate);

// ─── Domain routes (harus sebelum '/:id') ───────────────────────────────────

// Tamu yang sedang di dalam gedung
visitRouter.get(
  '/active',
  requirePermissions('visit:read'),
  validate(paginationQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const q = getValidated<PaginationQuery>(req, 'query');
      const locationId =
        typeof req.query.locationId === 'string' ? req.query.locationId : undefined;
      const result = await svc.listActive(q, locationId);
      res.json(ok(result.items, result.meta));
    } catch (err) {
      next(err);
    }
  },
);

// Walk-in check-in (data tamu inline, dedup by phone, notif host)
visitRouter.post(
  '/check-in',
  requirePermissions('visit:write'),
  validate(checkInSchema),
  audit('CREATE', 'visit'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const input = getValidated<CheckInInput>(req);
      const visit = await svc.checkIn(input, req.user?.id);
      res.status(201).json(ok(visit));
    } catch (err) {
      next(err);
    }
  },
);

// Check-out
visitRouter.post(
  '/:id/check-out',
  requirePermissions('visit:write'),
  audit('UPDATE', 'visit'),
  async (req, res, next) => {
    try {
      res.json(ok(await svc.checkOut(String(req.params.id))));
    } catch (err) {
      next(err);
    }
  },
);

// Host konfirmasi kedatangan (terima/tolak)
visitRouter.post(
  '/:id/confirm',
  requirePermissions('visit:confirm'),
  validate(confirmVisitSchema),
  audit('UPDATE', 'visit'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const input = getValidated<ConfirmVisitInput>(req);
      const actor = {
        id: req.user!.id,
        roles: req.user!.roles,
        permissions: req.user!.permissions,
      };
      res.json(ok(await svc.confirmArrival(String(req.params.id), input, actor)));
    } catch (err) {
      next(err);
    }
  },
);

// ─── CRUD admin ─────────────────────────────────────────────────────────────

visitRouter.get(
  '/',
  requirePermissions('visit:read'),
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

visitRouter.get(
  '/:id',
  requirePermissions('visit:read'),
  async (req, res, next) => {
    try {
      res.json(ok(await svc.get(String(req.params.id))));
    } catch (err) {
      next(err);
    }
  },
);

visitRouter.post(
  '/',
  requirePermissions('visit:write'),
  validate(createVisitSchema),
  audit('CREATE', 'visit'),
  async (req, res, next) => {
    try {
      const input = getValidated<CreateVisitInput>(req);
      res.status(201).json(ok(await svc.create(input)));
    } catch (err) {
      next(err);
    }
  },
);

visitRouter.patch(
  '/:id',
  requirePermissions('visit:write'),
  validate(updateVisitSchema),
  audit('UPDATE', 'visit'),
  async (req, res, next) => {
    try {
      const input = getValidated<UpdateVisitInput>(req);
      res.json(ok(await svc.update(String(req.params.id), input)));
    } catch (err) {
      next(err);
    }
  },
);

visitRouter.delete(
  '/:id',
  requirePermissions('visit:delete'),
  audit('DELETE', 'visit'),
  async (req, res, next) => {
    try {
      await svc.remove(String(req.params.id));
      res.json(ok({ deleted: true }));
    } catch (err) {
      next(err);
    }
  },
);
