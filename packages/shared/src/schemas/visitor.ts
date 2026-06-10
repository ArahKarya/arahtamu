import { z } from 'zod';

export const createVisitorSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  company: z.string().trim().max(200).optional(),
  phone: z.string().trim().min(3).max(30),
  email: z.string().trim().email().max(200).optional(),
  idNumber: z.string().trim().max(50).optional(),
  photoUrl: z.string().trim().max(500).optional(),
});

export const updateVisitorSchema = createVisitorSchema.partial();

export type CreateVisitorInput = z.infer<typeof createVisitorSchema>;
export type UpdateVisitorInput = z.infer<typeof updateVisitorSchema>;
