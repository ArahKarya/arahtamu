import { prisma } from '../../lib/prisma.js';

export interface VisitFilter {
  from?: Date;
  to?: Date;
  locationId?: string;
  hostId?: string;
  status?: string;
}

function buildWhere(f: VisitFilter): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (f.locationId) where.locationId = f.locationId;
  if (f.hostId) where.hostId = f.hostId;
  if (f.status) where.status = f.status;
  if (f.from || f.to) {
    where.createdAt = {
      ...(f.from ? { gte: f.from } : {}),
      ...(f.to ? { lte: f.to } : {}),
    };
  }
  return where;
}

/** Ringkasan metrik untuk dashboard. */
export async function summary() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [activeNow, checkInsToday, noShow, totalVisitors, byStatusRaw] = await Promise.all([
    prisma.visit.count({ where: { status: 'CHECKED_IN' } }),
    prisma.visit.count({ where: { checkInAt: { gte: startOfToday } } }),
    prisma.visit.count({ where: { status: 'NO_SHOW' } }),
    prisma.visitor.count(),
    prisma.visit.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const byStatus = Object.fromEntries(
    byStatusRaw.map((r) => [r.status, r._count._all]),
  ) as Record<string, number>;

  return { activeNow, checkInsToday, noShow, totalVisitors, byStatus };
}

interface VisitExportRow {
  createdAt: Date;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  status: string;
  purpose: string | null;
  visitor: { fullName: string; company: string | null; phone: string };
  host: { name: string };
  location: { name: string };
}

/** Ambil data kunjungan untuk diekspor (terbatas demi keamanan memori). */
export async function visitsForExport(f: VisitFilter, limit = 5000): Promise<VisitExportRow[]> {
  return prisma.visit.findMany({
    where: buildWhere(f),
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      visitor: { select: { fullName: true, company: true, phone: true } },
      host: { select: { name: true } },
      location: { select: { name: true } },
    },
  }) as unknown as Promise<VisitExportRow[]>;
}

const CSV_HEADERS = [
  'Tanggal',
  'Nama Tamu',
  'Instansi',
  'No HP',
  'Host',
  'Lokasi',
  'Keperluan',
  'Status',
  'Check-in',
  'Check-out',
];

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function fmt(d: Date | null): string {
  return d ? new Date(d).toISOString() : '';
}

/** Render baris kunjungan ke CSV (Excel-compatible, dengan BOM). */
export function toCsv(rows: VisitExportRow[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const r of rows) {
    lines.push(
      [
        fmt(r.createdAt),
        r.visitor.fullName,
        r.visitor.company ?? '',
        r.visitor.phone,
        r.host.name,
        r.location.name,
        r.purpose ?? '',
        r.status,
        fmt(r.checkInAt),
        fmt(r.checkOutAt),
      ]
        .map((v) => csvEscape(String(v)))
        .join(','),
    );
  }
  return '﻿' + lines.join('\n');
}
