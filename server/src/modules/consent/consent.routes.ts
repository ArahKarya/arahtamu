import { Router } from 'express';
import { ok, paginationQuerySchema } from '@arahtamu/shared';
import { authenticate } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { validate, getValidated } from '../../middleware/validate.js';
import { createConsentSchema, updateConsentSchema } from '@arahtamu/shared';
import type { CreateConsentInput, UpdateConsentInput, PaginationQuery } from '@arahtamu/shared';
import * as svc from './consent.service.js';

export const consentRouter = Router();

consentRouter.use(authenticate);

// Dokumen consent aktif (untuk kiosk check-in). Cukup izin visit:write (resepsionis/kiosk).
consentRouter.get(
  '/active',
  requirePermissions('visit:write'),
  async (_req, res, next) => {
    try {
      res.json(ok(await svc.listActive()));
    } catch (err) {
      next(err);
    }
  },
);

consentRouter.get(
  '/',
  requirePermissions('consent:read'),
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

consentRouter.get(
  '/:id',
  requirePermissions('consent:read'),
  async (req, res, next) => {
    try {
      res.json(ok(await svc.get(String(req.params.id))));
    } catch (err) {
      next(err);
    }
  },
);

consentRouter.post(
  '/',
  requirePermissions('consent:write'),
  validate(createConsentSchema),
  audit('CREATE', 'consent'),
  async (req, res, next) => {
    try {
      const input = getValidated<CreateConsentInput>(req);
      res.status(201).json(ok(await svc.create(input)));
    } catch (err) {
      next(err);
    }
  },
);

consentRouter.patch(
  '/:id',
  requirePermissions('consent:write'),
  validate(updateConsentSchema),
  audit('UPDATE', 'consent'),
  async (req, res, next) => {
    try {
      const input = getValidated<UpdateConsentInput>(req);
      res.json(ok(await svc.update(String(req.params.id), input)));
    } catch (err) {
      next(err);
    }
  },
);

consentRouter.delete(
  '/:id',
  requirePermissions('consent:delete'),
  audit('DELETE', 'consent'),
  async (req, res, next) => {
    try {
      await svc.remove(String(req.params.id));
      res.json(ok({ deleted: true }));
    } catch (err) {
      next(err);
    }
  },
);
