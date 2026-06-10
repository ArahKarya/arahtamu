import { z } from 'zod';
import { createVisitorSchema } from './visitor.js';

export const PREREG_STATUSES = ['PENDING', 'USED', 'EXPIRED', 'CANCELLED'] as const;
export type PreregStatus = (typeof PREREG_STATUSES)[number];

/** Host mendaftarkan tamu sebelum datang. */
export const createPreregistrationSchema = z.object({
  visitor: createVisitorSchema,
  hostId: z.string().cuid(),
  locationId: z.string().cuid(),
  scheduledAt: z.coerce.date(),
  purpose: z.string().trim().max(300).optional(),
});

export const updatePreregistrationSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  purpose: z.string().trim().max(300).optional(),
  status: z.enum(PREREG_STATUSES).optional(),
});

/** Tamu scan QR undangan di kiosk → check-in instan. */
export const scanPreregistrationSchema = z.object({
  qrToken: z.string().trim().min(8),
  photoUrl: z.string().trim().url().max(500).optional(),
  signatureUrl: z.string().trim().url().max(500).optional(),
});

export type CreatePreregistrationInput = z.infer<typeof createPreregistrationSchema>;
export type UpdatePreregistrationInput = z.infer<typeof updatePreregistrationSchema>;
export type ScanPreregistrationInput = z.infer<typeof scanPreregistrationSchema>;
