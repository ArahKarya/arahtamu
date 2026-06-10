import type { Processor } from 'bullmq';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { getRetentionDays, runRetention } from '../../modules/visit/retention.service.js';

export interface CleanupJobData {
  task: 'audit-log-purge' | 'expired-refresh-tokens' | 'temp-files' | 'visitor-retention';
  olderThanDays?: number;
}

export const cleanupProcessor: Processor<CleanupJobData> = async (job) => {
  const { task, olderThanDays = 90 } = job.data;
  const cutoff = new Date(Date.now() - olderThanDays * 86400 * 1000);

  if (task === 'visitor-retention') {
    const days = await getRetentionDays();
    const res = await runRetention(days);
    return res;
  }

  if (task === 'audit-log-purge') {
    const res = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
    logger.info({ deleted: res.count }, 'audit logs purged');
    return { deleted: res.count };
  }

  if (task === 'expired-refresh-tokens') {
    const res = await prisma.refreshToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }] },
    });
    logger.info({ deleted: res.count }, 'expired refresh tokens purged');
    return { deleted: res.count };
  }

  return { ok: true };
};
