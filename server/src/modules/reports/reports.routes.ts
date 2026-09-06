import { Router } from 'express';
import { ok } from '@fdm/shared';
import { authenticate } from '../../middleware/auth.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { audit } from '../../middleware/audit.js';
import * as svc from './reports.service.js';
import { getRetentionDays, runRetention } from '../visit/retention.service.js';

export const reportsRouter = Router();

reportsRouter.use(authenticate);

function parseFilter(query: Record<string, unknown>): svc.VisitFilter {
  const str = (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : undefined);
  const date = (v: unknown) => {
    const s = str(v);
    if (!s) return undefined;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  return {
    from: date(query.from),
    to: date(query.to),
    locationId: str(query.locationId),
    hostId: str(query.hostId),
    status: str(query.status),
  };
}

reportsRouter.get(
  '/summary',
  requirePermissions('report:read'),
  async (_req, res, next) => {
    try {
      res.json(ok(await svc.summary()));
    } catch (err) {
      next(err);
    }
  },
);

reportsRouter.get(
  '/export',
  requirePermissions('report:export'),
  async (req, res, next) => {
    try {
      const filter = parseFilter(req.query as Record<string, unknown>);
      const rows = await svc.visitsForExport(filter);
      const csv = svc.toCsv(rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="laporan-kunjungan.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  },
);

// Jalankan retensi UU PDP manual (admin). Cron harian juga aktif via worker.
reportsRouter.post(
  '/retention/run',
  requirePermissions('visit:delete'),
  audit('DELETE', 'visit'),
  async (_req, res, next) => {
    try {
      const days = await getRetentionDays();
      res.json(ok(await runRetention(days)));
    } catch (err) {
      next(err);
    }
  },
);
