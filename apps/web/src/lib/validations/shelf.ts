import { ShelfType } from '@bookapp/db';
import { z } from 'zod';


export const shelfTypeValues = Object.values(ShelfType) as [ShelfType, ...ShelfType[]];

export const addToShelfSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  shelfType: z.enum(shelfTypeValues),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  progressPages: z.number().int().min(0).optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const updateShelfEntrySchema = z.object({
  shelfType: z.enum(shelfTypeValues).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  progressPages: z.number().int().min(0).nullable().optional(),
  progressPercent: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const readingGoalSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  targetBooks: z.number().int().min(1).max(100),
});

export type AddToShelfInput = z.infer<typeof addToShelfSchema>;
export type UpdateShelfEntryInput = z.infer<typeof updateShelfEntrySchema>;
export type ReadingGoalInput = z.infer<typeof readingGoalSchema>;
