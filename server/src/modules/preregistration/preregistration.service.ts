import type {
  PaginationQuery,
  CreatePreregistrationInput,
  UpdatePreregistrationInput,
  ScanPreregistrationInput,
  CreateVisitorInput,
} from '@arahtamu/shared';
import { ConflictError } from '../../lib/errors.js';
import { preregistrationRepository } from './preregistration.repository.js';
import * as visitService from '../visit/visit.service.js';

export async function list(q: PaginationQuery) {
  const where = preregistrationRepository.buildSearchWhere(q.search);
  return preregistrationRepository.listWith(q, where);
}

export async function get(id: string) {
  return preregistrationRepository.findById(id);
}

export async function create(input: CreatePreregistrationInput, createdBy?: string) {
  return preregistrationRepository.createPrereg(input, createdBy);
}

export async function update(id: string, input: UpdatePreregistrationInput) {
  return preregistrationRepository.update(id, input as unknown as Record<string, unknown>);
}

export async function remove(id: string) {
  return preregistrationRepository.delete(id);
}

/**
 * Scan QR undangan → check-in instan.
 * Validasi status PENDING, jalankan check-in (termasuk cek watchlist),
 * lalu tandai pra-registrasi USED + tautkan visit.
 */
export async function scan(input: ScanPreregistrationInput, createdBy?: string) {
  const prereg = await preregistrationRepository.findByToken(input.qrToken);
  if (prereg.status !== 'PENDING') {
    throw ConflictError(`QR undangan tidak valid (status: ${prereg.status}).`);
  }

  const visit = await visitService.checkIn(
    {
      visitor: prereg.visitorData as CreateVisitorInput,
      hostId: prereg.hostId,
      locationId: prereg.locationId,
      purpose: prereg.purpose ?? undefined,
      photoUrl: input.photoUrl,
      signatureUrl: input.signatureUrl,
      consentAccepted: true,
    },
    createdBy,
  );

  await preregistrationRepository.markUsed(prereg.id, visit.id);
  return visit;
}
