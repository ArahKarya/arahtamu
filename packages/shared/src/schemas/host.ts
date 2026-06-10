import { z } from 'zod';

export const createHostSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional(),
  departmentId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  photoUrl: z.string().trim().url().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const updateHostSchema = createHostSchema.partial();

export type CreateHostInput = z.infer<typeof createHostSchema>;
export type UpdateHostInput = z.infer<typeof updateHostSchema>;
