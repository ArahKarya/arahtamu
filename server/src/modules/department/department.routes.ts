import { Router } from 'express';
import { ok, paginationQuerySchema } from '@arahtamu/shared';
import { authenticate } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { validate, getValidated } from '../../middleware/validate.js';
import { createDepartmentSchema, updateDepartmentSchema } from '@arahtamu/shared';
import type { CreateDepartmentInput, UpdateDepartmentInput, PaginationQuery } from '@arahtamu/shared';
import * as svc from './department.service.js';

export const departmentRouter = Router();

departmentRouter.use(authenticate);

departmentRouter.get(
  '/',
  requirePermissions('department:read'),
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

departmentRouter.get(
  '/:id',
  requirePermissions('department:read'),
  async (req, res, next) => {
    try {
      res.json(ok(await svc.get(String(req.params.id))));
    } catch (err) {
      next(err);
    }
  },
);

departmentRouter.post(
  '/',
  requirePermissions('department:write'),
  validate(createDepartmentSchema),
  audit('CREATE', 'department'),
  async (req, res, next) => {
    try {
      const input = getValidated<CreateDepartmentInput>(req);
      res.status(201).json(ok(await svc.create(input)));
    } catch (err) {
      next(err);
    }
  },
);

departmentRouter.patch(
  '/:id',
  requirePermissions('department:write'),
  validate(updateDepartmentSchema),
  audit('UPDATE', 'department'),
  async (req, res, next) => {
    try {
      const input = getValidated<UpdateDepartmentInput>(req);
      res.json(ok(await svc.update(String(req.params.id), input)));
    } catch (err) {
      next(err);
    }
  },
);

departmentRouter.delete(
  '/:id',
  requirePermissions('department:delete'),
  audit('DELETE', 'department'),
  async (req, res, next) => {
    try {
      await svc.remove(String(req.params.id));
      res.json(ok({ deleted: true }));
    } catch (err) {
      next(err);
    }
  },
);
