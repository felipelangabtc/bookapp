import { z } from 'zod';

export const bookSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  language: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(['relevance', 'title', 'publishedDate', 'rating']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  subtitle: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  authors: z.array(z.string()).min(1, 'At least one author is required'),
  coverImage: z.string().url().optional().or(z.literal('')),
  language: z.string().default('en'),
  publishedDate: z.string().optional(),
  isbn10: z
    .string()
    .regex(/^\d{10}$/, 'ISBN-10 must be 10 digits')
    .optional()
    .or(z.literal('')),
  isbn13: z
    .string()
    .regex(/^\d{13}$/, 'ISBN-13 must be 13 digits')
    .optional()
    .or(z.literal('')),
  pageCount: z.number().int().positive().optional(),
  publisher: z.string().max(200).optional(),
  categories: z.array(z.string()).optional(),
});

export const updateBookSchema = createBookSchema.partial();

export const importBookSchema = z.object({
  googleBooksId: z.string().optional(),
  openLibraryId: z.string().optional(),
}).refine((data) => data.googleBooksId || data.openLibraryId, {
  message: 'Either Google Books ID or Open Library ID is required',
});

export type BookSearchInput = z.infer<typeof bookSearchSchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type ImportBookInput = z.infer<typeof importBookSchema>;
