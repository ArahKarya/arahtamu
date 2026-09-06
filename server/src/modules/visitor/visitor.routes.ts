import { Router } from 'express';
import { ok, paginationQuerySchema } from '@fdm/shared';
import { authenticate } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { validate, getValidated } from '../../middleware/validate.js';
import { createVisitorSchema, updateVisitorSchema } from '@fdm/shared';
import type { CreateVisitorInput, UpdateVisitorInput, PaginationQuery } from '@fdm/shared';
import * as svc from './visitor.service.js';
import { eraseVisitor } from '../visit/retention.service.js';

export const visitorRouter = Router();

visitorRouter.use(authenticate);

// Hak untuk dihapus (UU PDP): hapus tamu + seluruh kunjungan & consent log terkait.
visitorRouter.post(
  '/:id/erase',
  requirePermissions('visitor:delete'),
  audit('DELETE', 'visitor'),
  async (req, res, next) => {
    try {
      res.json(ok(await eraseVisitor(String(req.params.id))));
    } catch (err) {
      next(err);
    }
  },
);

visitorRouter.get(
  '/',
  requirePermissions('visitor:read'),
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

visitorRouter.get(
  '/:id',
  requirePermissions('visitor:read'),
  async (req, res, next) => {
    try {
      res.json(ok(await svc.get(String(req.params.id))));
    } catch (err) {
      next(err);
    }
  },
);

visitorRouter.post(
  '/',
  requirePermissions('visitor:write'),
  validate(createVisitorSchema),
  audit('CREATE', 'visitor'),
  async (req, res, next) => {
    try {
      const input = getValidated<CreateVisitorInput>(req);
      res.status(201).json(ok(await svc.create(input)));
    } catch (err) {
      next(err);
    }
  },
);

visitorRouter.patch(
  '/:id',
  requirePermissions('visitor:write'),
  validate(updateVisitorSchema),
  audit('UPDATE', 'visitor'),
  async (req, res, next) => {
    try {
      const input = getValidated<UpdateVisitorInput>(req);
      res.json(ok(await svc.update(String(req.params.id), input)));
    } catch (err) {
      next(err);
    }
  },
);

visitorRouter.delete(
  '/:id',
  requirePermissions('visitor:delete'),
  audit('DELETE', 'visitor'),
  async (req, res, next) => {
    try {
      await svc.remove(String(req.params.id));
      res.json(ok({ deleted: true }));
    } catch (err) {
      next(err);
    }
  },
);
