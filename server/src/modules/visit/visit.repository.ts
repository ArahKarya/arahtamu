import { randomUUID } from 'node:crypto';
import type { PaginationQuery, CheckInInput } from '@arahtamu/shared';
import { BaseRepository } from '../../lib/base-repository.js';
import { prisma } from '../../lib/prisma.js';
import { ConflictError } from '../../lib/errors.js';
import type { VisitEntity } from './visit.types.js';

const VISIT_INCLUDE = {
  visitor: true,
  host: { select: { id: true, name: true, email: true, userId: true } },
  location: { select: { id: true, name: true } },
} as const;

class VisitRepositoryImpl extends BaseRepository<VisitEntity> {
  constructor() {
    super('visit', VISIT_INCLUDE as unknown as Record<string, unknown>);
  }

  buildSearchWhere(search?: string): Record<string, unknown> {
    if (!search) return {};
    return {
      OR: [
        { purpose: { contains: search, mode: 'insensitive' } },
        { visitor: { fullName: { contains: search, mode: 'insensitive' } } },
        { badgeCode: { equals: search } },
      ],
    };
  }

  /** Daftar tamu yang sedang di dalam gedung (status CHECKED_IN). */
  async listActive(q: PaginationQuery, locationId?: string) {
    const where: Record<string, unknown> = {
      status: 'CHECKED_IN',
      ...(locationId ? { locationId } : {}),
    };
    return this.findMany(q, where, {
      include: VISIT_INCLUDE as unknown as Record<string, unknown>,
      orderBy: { checkInAt: 'desc' },
    });
  }

  /**
   * Walk-in check-in: dedup visitor by phone, buat Visit (CHECKED_IN),
   * dan notifikasi in-app ke user host (kalau tertaut). Semua dalam 1 transaksi.
   */
  async checkIn(input: CheckInInput, createdBy?: string): Promise<VisitEntity> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.visitor.findFirst({ where: { phone: input.visitor.phone } });
      const visitor = existing
        ? await tx.visitor.update({ where: { id: existing.id }, data: { ...input.visitor } })
        : await tx.visitor.create({ data: { ...input.visitor } });

      const visit = await tx.visit.create({
        data: {
          visitorId: visitor.id,
          hostId: input.hostId,
          locationId: input.locationId,
          purpose: input.purpose,
          status: 'CHECKED_IN',
          checkInAt: new Date(),
          photoUrl: input.photoUrl,
          signatureUrl: input.signatureUrl,
          badgeCode: randomUUID(),
          formData: input.formData === undefined ? undefined : (input.formData as object),
          createdBy,
        },
        include: VISIT_INCLUDE,
      });

      const host = await tx.host.findUnique({
        where: { id: input.hostId },
        select: { userId: true },
      });
      if (host?.userId) {
        await tx.notification.create({
          data: {
            userId: host.userId,
            title: 'Tamu datang',
            message: `${visitor.fullName} check-in untuk menemui Anda.`,
            type: 'visit',
            link: `/visits/${visit.id}`,
            metadata: { visitId: visit.id, visitorId: visitor.id },
          },
        });
      }

      return visit as unknown as VisitEntity;
    });
  }

  /** Check-out: tandai CHECKED_OUT + checkOutAt. Tolak kalau sudah keluar. */
  async checkOut(id: string): Promise<VisitEntity> {
    const visit = await this.findById(id);
    if (visit.status === 'CHECKED_OUT') {
      throw ConflictError('Tamu sudah check-out.');
    }
    const updated = await prisma.visit.update({
      where: { id },
      data: { status: 'CHECKED_OUT', checkOutAt: new Date() },
      include: VISIT_INCLUDE,
    });
    return updated as unknown as VisitEntity;
  }
}

export const visitRepository = new VisitRepositoryImpl();
