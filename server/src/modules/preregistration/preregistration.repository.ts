import { randomUUID } from 'node:crypto';
import type { PaginationQuery, CreatePreregistrationInput } from '@fdm/shared';
import { BaseRepository } from '../../lib/base-repository.js';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import type { PreregistrationEntity } from './preregistration.types.js';

const PREREG_INCLUDE = {
  host: { select: { id: true, name: true, email: true } },
  location: { select: { id: true, name: true } },
} as const;

class PreregistrationRepositoryImpl extends BaseRepository<PreregistrationEntity> {
  constructor() {
    super('preregistration', PREREG_INCLUDE as unknown as Record<string, unknown>);
  }

  buildSearchWhere(search?: string): Record<string, unknown> {
    if (!search) return {};
    return { qrToken: { equals: search } };
  }

  async listWith(q: PaginationQuery, where: Record<string, unknown>) {
    return this.findMany(q, where, {
      include: PREREG_INCLUDE as unknown as Record<string, unknown>,
      orderBy: { scheduledAt: 'desc' },
    });
  }

  /** Buat pra-registrasi + token QR unik. */
  async createPrereg(
    input: CreatePreregistrationInput,
    createdBy?: string,
  ): Promise<PreregistrationEntity> {
    const created = await prisma.preregistration.create({
      data: {
        hostId: input.hostId,
        locationId: input.locationId,
        visitorData: input.visitor,
        purpose: input.purpose,
        scheduledAt: input.scheduledAt,
        qrToken: randomUUID(),
        status: 'PENDING',
        createdBy,
      },
      include: PREREG_INCLUDE,
    });
    return created as unknown as PreregistrationEntity;
  }

  /** Ambil pra-registrasi by qrToken (untuk scan check-in). */
  async findByToken(qrToken: string): Promise<PreregistrationEntity> {
    const prereg = (await prisma.preregistration.findUnique({
      where: { qrToken },
    })) as PreregistrationEntity | null;
    if (!prereg) throw NotFoundError('Preregistration', qrToken);
    return prereg;
  }

  async markUsed(id: string, visitId: string): Promise<void> {
    await prisma.preregistration.update({
      where: { id },
      data: { status: 'USED', visitId },
    });
  }
}

export const preregistrationRepository = new PreregistrationRepositoryImpl();
