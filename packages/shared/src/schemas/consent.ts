import { z } from 'zod';

export const CONSENT_TYPES = ['NDA', 'TATA_TERTIB', 'PDP'] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

export const createConsentSchema = z.object({
  type: z.enum(CONSENT_TYPES),
  title: z.string().trim().min(1).max(200),
  version: z.string().trim().min(1).max(20),
  contentMd: z.string().trim().min(1),
  active: z.boolean().default(true),
});

export const updateConsentSchema = createConsentSchema.partial();

export type CreateConsentInput = z.infer<typeof createConsentSchema>;
export type UpdateConsentInput = z.infer<typeof updateConsentSchema>;
