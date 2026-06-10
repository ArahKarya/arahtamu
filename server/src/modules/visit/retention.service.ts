import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

export const RETENTION_SETTING_KEY = 'pdp.retentionDays';
export const DEFAULT_RETENTION_DAYS = 90;

/** Ambil masa retensi (hari) dari Settings, fallback default. */
export async function getRetentionDays(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: RETENTION_SETTING_KEY } });
  const val = Number(row?.value);
  return Number.isFinite(val) && val > 0 ? val : DEFAULT_RETENTION_DAYS;
}

export interface RetentionResult {
  cutoff: string;
  deletedVisits: number;
  deletedVisitors: number;
}

/**
 * Hapus kunjungan + data tamu yang melewati masa retensi (UU PDP),
 * KECUALI tamu yang ada di daftar blokir (watchlist BLOCK).
 * ConsentLog ikut terhapus (cascade dari Visit).
 */
export async function runRetention(retentionDays: number): Promise<RetentionResult> {
  const cutoff = new Date(Date.now() - retentionDays * 86400 * 1000);

  const blocked = await prisma.watchlist.findMany({
    where: { level: 'BLOCK' },
    select: { phone: true },
  });
  const blockedPhones = blocked.map((b) => b.phone).filter((p): p is string => !!p);

  const oldVisits = await prisma.visit.findMany({
    where: {
      createdAt: { lt: cutoff },
      visitor: { phone: { notIn: blockedPhones } },
    },
    select: { id: true },
  });
  const delVisits = await prisma.visit.deleteMany({
    where: { id: { in: oldVisits.map((v) => v.id) } },
  });

  // Tamu tanpa kunjungan tersisa & bukan daftar blokir → hapus.
  const orphans = await prisma.visitor.findMany({
    where: { visits: { none: {} }, phone: { notIn: blockedPhones } },
    select: { id: true },
  });
  const delVisitors = await prisma.visitor.deleteMany({
    where: { id: { in: orphans.map((v) => v.id) } },
  });

  const result: RetentionResult = {
    cutoff: cutoff.toISOString(),
    deletedVisits: delVisits.count,
    deletedVisitors: delVisitors.count,
  };
  logger.info(result, '[retention] selesai');
  return result;
}

/**
 * Hak untuk dihapus (right to erasure): hapus seorang tamu + seluruh kunjungan
 * & consent log terkait (cascade). Mengembalikan jumlah kunjungan yang terhapus.
 */
export async function eraseVisitor(visitorId: string): Promise<{ deletedVisits: number }> {
  const visitCount = await prisma.visit.count({ where: { visitorId } });
  await prisma.visitor.delete({ where: { id: visitorId } });
  return { deletedVisits: visitCount };
}
