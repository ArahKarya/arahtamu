import type {
  PaginationQuery,
  CreateVisitInput,
  UpdateVisitInput,
  CheckInInput,
} from '@arahtamu/shared';
import { JOB_QUEUES } from '@arahtamu/shared';
import { prisma } from '../../lib/prisma.js';
import { ForbiddenError } from '../../lib/errors.js';
import { enqueue } from '../../services/queue.js';
import { visitRepository } from './visit.repository.js';
import * as watchlist from '../watchlist/watchlist.service.js';

export async function list(q: PaginationQuery) {
  const where = visitRepository.buildSearchWhere(q.search);
  return visitRepository.findMany(q, where);
}

export async function listActive(q: PaginationQuery, locationId?: string) {
  return visitRepository.listActive(q, locationId);
}

/** Kirim notifikasi in-app ke semua user berperan SECURITY. */
async function notifySecurity(title: string, message: string, link?: string): Promise<void> {
  const securityUsers = await prisma.user.findMany({
    where: { isActive: true, roles: { some: { role: { name: 'SECURITY' } } } },
    select: { id: true },
  });
  if (securityUsers.length === 0) return;
  await prisma.notification.createMany({
    data: securityUsers.map((u) => ({ userId: u.id, title, message, type: 'security', link })),
  });
}

export async function checkIn(input: CheckInInput, createdBy?: string) {
  const match = await watchlist.findMatch({
    phone: input.visitor.phone,
    fullName: input.visitor.fullName,
    idNumber: input.visitor.idNumber,
  });

  // BLOCK → tolak check-in + peringatkan security
  if (match?.level === 'BLOCK') {
    await notifySecurity(
      'Tamu diblokir mencoba check-in',
      `${input.visitor.fullName} (daftar blokir: ${match.reason}) ditolak saat check-in.`,
    );
    throw ForbiddenError(`Tamu dalam daftar blokir: ${match.reason}`);
  }

  const visit = await visitRepository.checkIn(input, createdBy);

  // Notif email ke host (best-effort; fallback log kalau Resend/Redis tidak ada).
  const v = visit as unknown as {
    host?: { email?: string; name?: string };
    visitor?: { fullName?: string };
  };
  if (v.host?.email) {
    void enqueue(JOB_QUEUES.EMAIL, 'host-visit-notify', {
      to: v.host.email,
      subject: 'Tamu Anda telah tiba',
      html: `<p>Halo ${v.host.name ?? ''},</p><p>${
        v.visitor?.fullName ?? 'Seorang tamu'
      } telah check-in untuk menemui Anda.</p>`,
    });
  }

  // WATCH → izinkan tapi flag + beritahu security
  if (match?.level === 'WATCH') {
    await notifySecurity(
      'Tamu watchlist check-in',
      `${input.visitor.fullName} (watchlist: ${match.reason}) baru saja check-in.`,
      `/visits/${visit.id}`,
    );
  }

  return { ...visit, watchlistFlag: match?.level ?? null };
}

export async function checkOut(id: string) {
  return visitRepository.checkOut(id);
}

export async function get(id: string) {
  return visitRepository.findById(id);
}

export async function create(input: CreateVisitInput) {
  return visitRepository.create(input as unknown as Record<string, unknown>);
}

export async function update(id: string, input: UpdateVisitInput) {
  return visitRepository.update(id, input as unknown as Record<string, unknown>);
}

export async function remove(id: string) {
  return visitRepository.delete(id);
}
