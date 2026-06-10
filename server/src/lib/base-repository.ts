import type { PaginationQuery } from '@arahtamu/shared';
import { buildPagination, toSkipTake } from '@arahtamu/shared';
import { prisma } from './prisma.js';
import { NotFoundError } from './errors.js';

export interface FindOptions {
  include?: Record<string, unknown>;
  orderBy?: Record<string, string>;
}

export class BaseRepository<T extends { id: string }> {
  constructor(
    private readonly modelName: string,
    private readonly defaultInclude?: Record<string, unknown>,
  ) {}

  private get model() {
    return (prisma as unknown as Record<string, {
      findMany: (args: unknown) => Promise<unknown[]>;
      findUnique: (args: unknown) => Promise<unknown | null>;
      create: (args: unknown) => Promise<unknown>;
      update: (args: unknown) => Promise<unknown>;
      delete: (args: unknown) => Promise<unknown>;
      count: (args: unknown) => Promise<number>;
    }>)[this.modelName]!;
  }

  async findMany(q: PaginationQuery, where: Record<string, unknown> = {}, opts?: FindOptions) {
    const { skip, take } = toSkipTake(q.page, q.limit);
    const include = opts?.include ?? this.defaultInclude;
    const orderBy = opts?.orderBy ?? { createdAt: q.sortOrder };

    const [items, total] = await Promise.all([
      this.model.findMany({ where, skip, take, orderBy, ...(include ? { include } : {}) }),
      this.model.count({ where }),
    ]);

    return buildPagination(items as T[], total, q.page, q.limit);
  }

  async findById(id: string, opts?: FindOptions): Promise<T> {
    const include = opts?.include ?? this.defaultInclude;
    const item = (await this.model.findUnique({
      where: { id },
      ...(include ? { include } : {}),
    })) as T | null;
    if (!item) throw NotFoundError(this.modelName, id);
    return item;
  }

  async create(data: Record<string, unknown>, opts?: FindOptions): Promise<T> {
    const include = opts?.include ?? this.defaultInclude;
    return this.model.create({ data, ...(include ? { include } : {}) }) as Promise<T>;
  }

  async update(id: string, data: Record<string, unknown>, opts?: FindOptions): Promise<T> {
    await this.findById(id);
    const include = opts?.include ?? this.defaultInclude;
    return this.model.update({ where: { id }, data, ...(include ? { include } : {}) }) as Promise<T>;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.model.delete({ where: { id } });
  }

  async count(where: Record<string, unknown> = {}): Promise<number> {
    return this.model.count({ where });
  }

  async exists(where: Record<string, unknown>): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }
}
