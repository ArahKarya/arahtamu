import type {
  PaginationQuery,
  CreateVisitInput,
  UpdateVisitInput,
  CheckInInput,
} from '@arahtamu/shared';
import { visitRepository } from './visit.repository.js';

export async function list(q: PaginationQuery) {
  const where = visitRepository.buildSearchWhere(q.search);
  return visitRepository.findMany(q, where);
}

export async function listActive(q: PaginationQuery, locationId?: string) {
  return visitRepository.listActive(q, locationId);
}

export async function checkIn(input: CheckInInput, createdBy?: string) {
  return visitRepository.checkIn(input, createdBy);
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
