import { Router } from 'express';
import { ok, paginationQuerySchema } from '@fdm/shared';
import { authenticate } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { validate, getValidated } from '../../middleware/validate.js';
import { createLocationSchema, updateLocationSchema } from '@fdm/shared';
import type { CreateLocationInput, UpdateLocationInput, PaginationQuery } from '@fdm/shared';
import * as svc from './location.service.js';

export const locationRouter = Router();

locationRouter.use(authenticate);

locationRouter.get(
  '/',
  requirePermissions('location:read'),
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

locationRouter.get(
  '/:id',
  requirePermissions('location:read'),
  async (req, res, next) => {
    try {
      res.json(ok(await svc.get(String(req.params.id))));
    } catch (err) {
      next(err);
    }
  },
);

locationRouter.post(
  '/',
  requirePermissions('location:write'),
  validate(createLocationSchema),
  audit('CREATE', 'location'),
  async (req, res, next) => {
    try {
      const input = getValidated<CreateLocationInput>(req);
      res.status(201).json(ok(await svc.create(input)));
    } catch (err) {
      next(err);
    }
  },
);

locationRouter.patch(
  '/:id',
  requirePermissions('location:write'),
  validate(updateLocationSchema),
  audit('UPDATE', 'location'),
  async (req, res, next) => {
    try {
      const input = getValidated<UpdateLocationInput>(req);
      res.json(ok(await svc.update(String(req.params.id), input)));
    } catch (err) {
      next(err);
    }
  },
);

locationRouter.delete(
  '/:id',
  requirePermissions('location:delete'),
  audit('DELETE', 'location'),
  async (req, res, next) => {
    try {
      await svc.remove(String(req.params.id));
      res.json(ok({ deleted: true }));
    } catch (err) {
      next(err);
    }
  },
);
