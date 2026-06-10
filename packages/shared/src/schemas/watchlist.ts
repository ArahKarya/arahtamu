import { z } from 'zod';

export const WATCHLIST_LEVELS = ['WATCH', 'BLOCK'] as const;
export type WatchlistLevel = (typeof WATCHLIST_LEVELS)[number];

export const createWatchlistSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(30).optional(),
  idNumber: z.string().trim().max(50).optional(),
  reason: z.string().trim().min(1).max(500),
  level: z.enum(WATCHLIST_LEVELS).default('WATCH'),
});

export const updateWatchlistSchema = createWatchlistSchema.partial();

export type CreateWatchlistInput = z.infer<typeof createWatchlistSchema>;
export type UpdateWatchlistInput = z.infer<typeof updateWatchlistSchema>;
