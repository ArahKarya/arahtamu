import type { PaginationQuery, CreateWatchlistInput, UpdateWatchlistInput } from '@fdm/shared';
import { buildPagination, toSkipTake } from '@fdm/shared';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';

const model = (prisma as unknown as Record<string, {
  findMany: (args: unknown) => Promise<unknown[]>;
  count: (args: unknown) => Promise<number>;
  findUnique: (args: unknown) => Promise<unknown | null>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
}>)['watchlist'];

export async function list(q: PaginationQuery) {
  const { skip, take } = toSkipTake(q.page, q.limit);
  const where: Record<string, unknown> = q.search
    ? {
        OR: [
          { fullName: { contains: q.search, mode: 'insensitive' } },
          { phone: { contains: q.search } },
          { idNumber: { contains: q.search } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    model.findMany({ where, skip, take, orderBy: { createdAt: q.sortOrder } }),
    model.count({ where }),
  ]);
  return buildPagination(items, total, q.page, q.limit);
}

/**
 * Cari entri watchlist yang cocok untuk seorang tamu (by phone atau nama persis).
 * Mengembalikan entri level tertinggi (BLOCK diutamakan) atau null.
 */
export async function findMatch(params: {
  phone?: string;
  fullName?: string;
  idNumber?: string;
}): Promise<{ id: string; level: 'WATCH' | 'BLOCK'; reason: string } | null> {
  const or: Record<string, unknown>[] = [];
  if (params.phone) or.push({ phone: params.phone });
  if (params.idNumber) or.push({ idNumber: params.idNumber });
  if (params.fullName) or.push({ fullName: { equals: params.fullName, mode: 'insensitive' } });
  if (or.length === 0) return null;

  const matches = (await model.findMany({ where: { OR: or } })) as Array<{
    id: string;
    level: 'WATCH' | 'BLOCK';
    reason: string;
  }>;
  if (matches.length === 0) return null;
  return matches.find((m) => m.level === 'BLOCK') ?? matches[0]!;
}

export async function get(id: string) {
  const item = await model.findUnique({ where: { id } });
  if (!item) throw NotFoundError('Watchlist', id);
  return item;
}

export async function create(input: CreateWatchlistInput) {
  return model.create({ data: input });
}

export async function update(id: string, input: UpdateWatchlistInput) {
  await get(id);
  return model.update({ where: { id }, data: input });
}

export async function remove(id: string) {
  await get(id);
  await model.delete({ where: { id } });
}
