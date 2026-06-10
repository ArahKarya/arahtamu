import { z } from 'zod';
import { createVisitorSchema } from './visitor.js';

export const VISIT_STATUSES = [
  'PREREGISTERED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'DENIED',
  'NO_SHOW',
] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

/** CRUD admin — mengacu visitor yang sudah ada */
export const createVisitSchema = z.object({
  visitorId: z.string().cuid(),
  hostId: z.string().cuid(),
  locationId: z.string().cuid(),
  purpose: z.string().trim().max(300).optional(),
  status: z.enum(VISIT_STATUSES).optional(),
  photoUrl: z.string().trim().url().max(500).optional(),
  signatureUrl: z.string().trim().url().max(500).optional(),
  formData: z.record(z.unknown()).optional(),
});

export const updateVisitSchema = createVisitSchema.partial();

/** Walk-in check-in (kiosk/resepsionis) — data tamu inline, dedup by phone */
export const checkInSchema = z.object({
  visitor: createVisitorSchema,
  hostId: z.string().cuid(),
  locationId: z.string().cuid(),
  purpose: z.string().trim().max(300).optional(),
  photoUrl: z.string().trim().url().max(500).optional(),
  signatureUrl: z.string().trim().url().max(500).optional(),
  formData: z.record(z.unknown()).optional(),
  /** Tamu menyetujui dokumen consent aktif (default true di kiosk). */
  consentAccepted: z.boolean().default(true),
  /** IP/sumber kiosk untuk catatan consent (opsional). */
  consentIp: z.string().trim().max(64).optional(),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
