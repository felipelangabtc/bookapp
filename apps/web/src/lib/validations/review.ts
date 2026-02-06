import { z } from 'zod';

export const createReviewSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  rating: z
    .number()
    .min(0.5, 'Rating must be at least 0.5')
    .max(5, 'Rating cannot exceed 5')
    .multipleOf(0.5, 'Rating must be in 0.5 increments'),
  title: z.string().max(200).optional(),
  body: z.string().max(20000).optional(),
  hasSpoilers: z.boolean().default(false),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .min(0.5, 'Rating must be at least 0.5')
    .max(5, 'Rating cannot exceed 5')
    .multipleOf(0.5, 'Rating must be in 0.5 increments')
    .optional(),
  title: z.string().max(200).nullable().optional(),
  body: z.string().max(20000).nullable().optional(),
  hasSpoilers: z.boolean().optional(),
});

export const createReviewCommentSchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required'),
  parentId: z.string().optional(),
  body: z.string().min(1, 'Comment cannot be empty').max(5000),
  hasSpoilers: z.boolean().default(false),
});

export const updateReviewCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(5000).optional(),
  hasSpoilers: z.boolean().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type CreateReviewCommentInput = z.infer<typeof createReviewCommentSchema>;
export type UpdateReviewCommentInput = z.infer<typeof updateReviewCommentSchema>;
