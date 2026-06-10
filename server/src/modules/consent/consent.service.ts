import type { PaginationQuery, CreateConsentInput, UpdateConsentInput } from '@arahtamu/shared';
import { buildPagination, toSkipTake } from '@arahtamu/shared';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';

const model = (prisma as unknown as Record<string, {
  findMany: (args: unknown) => Promise<unknown[]>;
  count: (args: unknown) => Promise<number>;
  findUnique: (args: unknown) => Promise<unknown | null>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
}>)['consent'];

export async function list(q: PaginationQuery) {
  const { skip, take } = toSkipTake(q.page, q.limit);
  const where: Record<string, unknown> = q.search
    ? { title: { contains: q.search, mode: 'insensitive' } }
    : {};
  const [items, total] = await Promise.all([
    model.findMany({ where, skip, take, orderBy: { createdAt: q.sortOrder } }),
    model.count({ where }),
  ]);
  return buildPagination(items, total, q.page, q.limit);
}

/** Daftar dokumen consent yang aktif (untuk kiosk & pencatatan saat check-in). */
export async function listActive(): Promise<
  Array<{ id: string; type: string; title: string; version: string }>
> {
  return model.findMany({ where: { active: true } }) as Promise<
    Array<{ id: string; type: string; title: string; version: string }>
  >;
}

export async function get(id: string) {
  const item = await model.findUnique({ where: { id } });
  if (!item) throw NotFoundError('Consent', id);
  return item;
}

export async function create(input: CreateConsentInput) {
  return model.create({ data: input });
}

export async function update(id: string, input: UpdateConsentInput) {
  await get(id);
  return model.update({ where: { id }, data: input });
}

export async function remove(id: string) {
  await get(id);
  await model.delete({ where: { id } });
}
