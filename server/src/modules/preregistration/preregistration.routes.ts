import { Router } from 'express';
import { ok, paginationQuerySchema } from '@fdm/shared';
import { authenticate, type AuthenticatedRequest } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { validate, getValidated } from '../../middleware/validate.js';
import {
  createPreregistrationSchema,
  updatePreregistrationSchema,
  scanPreregistrationSchema,
} from '@fdm/shared';
import type {
  CreatePreregistrationInput,
  UpdatePreregistrationInput,
  ScanPreregistrationInput,
  PaginationQuery,
} from '@fdm/shared';
import * as svc from './preregistration.service.js';

export const preregistrationRouter = Router();

preregistrationRouter.use(authenticate);

// Scan QR undangan → check-in instan (harus sebelum '/:id')
preregistrationRouter.post(
  '/scan',
  requirePermissions('visit:write'),
  validate(scanPreregistrationSchema),
  audit('CREATE', 'visit'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const input = getValidated<ScanPreregistrationInput>(req);
      res.status(201).json(ok(await svc.scan(input, req.user?.id)));
    } catch (err) {
      next(err);
    }
  },
);

preregistrationRouter.get(
  '/',
  requirePermissions('preregistration:read'),
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

preregistrationRouter.get(
  '/:id',
  requirePermissions('preregistration:read'),
  async (req, res, next) => {
    try {
      res.json(ok(await svc.get(String(req.params.id))));
    } catch (err) {
      next(err);
    }
  },
);

preregistrationRouter.post(
  '/',
  requirePermissions('preregistration:write'),
  validate(createPreregistrationSchema),
  audit('CREATE', 'preregistration'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const input = getValidated<CreatePreregistrationInput>(req);
      res.status(201).json(ok(await svc.create(input, req.user?.id)));
    } catch (err) {
      next(err);
    }
  },
);

preregistrationRouter.patch(
  '/:id',
  requirePermissions('preregistration:write'),
  validate(updatePreregistrationSchema),
  audit('UPDATE', 'preregistration'),
  async (req, res, next) => {
    try {
      const input = getValidated<UpdatePreregistrationInput>(req);
      res.json(ok(await svc.update(String(req.params.id), input)));
    } catch (err) {
      next(err);
    }
  },
);

preregistrationRouter.delete(
  '/:id',
  requirePermissions('preregistration:delete'),
  audit('DELETE', 'preregistration'),
  async (req, res, next) => {
    try {
      await svc.remove(String(req.params.id));
      res.json(ok({ deleted: true }));
    } catch (err) {
      next(err);
    }
  },
);
