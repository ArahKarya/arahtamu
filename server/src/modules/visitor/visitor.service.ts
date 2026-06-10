import type { PaginationQuery, CreateVisitorInput, UpdateVisitorInput } from '@arahtamu/shared';
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
}>)['visitor'];

export async function list(q: PaginationQuery) {
  const { skip, take } = toSkipTake(q.page, q.limit);
  const where: Record<string, unknown> = q.search
    ? {
        OR: [
          { fullName: { contains: q.search, mode: 'insensitive' } },
          { company: { contains: q.search, mode: 'insensitive' } },
          { phone: { contains: q.search } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    model.findMany({ where, skip, take, orderBy: { createdAt: q.sortOrder } }),
    model.count({ where }),
  ]);
  return buildPagination(items, total, q.page, q.limit);
}

export async function get(id: string) {
  const item = await model.findUnique({ where: { id } });
  if (!item) throw NotFoundError('Visitor', id);
  return item;
}

export async function create(input: CreateVisitorInput) {
  return model.create({ data: input });
}

export async function update(id: string, input: UpdateVisitorInput) {
  await get(id);
  return model.update({ where: { id }, data: input });
}

export async function remove(id: string) {
  await get(id);
  await model.delete({ where: { id } });
}
