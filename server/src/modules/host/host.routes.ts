import { Router } from 'express';
import { ok, paginationQuerySchema } from '@arahtamu/shared';
import { authenticate } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { validate, getValidated } from '../../middleware/validate.js';
import { createHostSchema, updateHostSchema } from '@arahtamu/shared';
import type { CreateHostInput, UpdateHostInput, PaginationQuery } from '@arahtamu/shared';
import * as svc from './host.service.js';

export const hostRouter = Router();

hostRouter.use(authenticate);

hostRouter.get(
  '/',
  requirePermissions('host:read'),
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

hostRouter.get(
  '/:id',
  requirePermissions('host:read'),
  async (req, res, next) => {
    try {
      res.json(ok(await svc.get(String(req.params.id))));
    } catch (err) {
      next(err);
    }
  },
);

hostRouter.post(
  '/',
  requirePermissions('host:write'),
  validate(createHostSchema),
  audit('CREATE', 'host'),
  async (req, res, next) => {
    try {
      const input = getValidated<CreateHostInput>(req);
      res.status(201).json(ok(await svc.create(input)));
    } catch (err) {
      next(err);
    }
  },
);

hostRouter.patch(
  '/:id',
  requirePermissions('host:write'),
  validate(updateHostSchema),
  audit('UPDATE', 'host'),
  async (req, res, next) => {
    try {
      const input = getValidated<UpdateHostInput>(req);
      res.json(ok(await svc.update(String(req.params.id), input)));
    } catch (err) {
      next(err);
    }
  },
);

hostRouter.delete(
  '/:id',
  requirePermissions('host:delete'),
  audit('DELETE', 'host'),
  async (req, res, next) => {
    try {
      await svc.remove(String(req.params.id));
      res.json(ok({ deleted: true }));
    } catch (err) {
      next(err);
    }
  },
);
