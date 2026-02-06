import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().max(100).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  preferredLanguage: z.string().optional(),
  country: z.string().max(100).nullable().optional(),
  avatar: z.string().url().nullable().optional().or(z.literal('')),
});

export const updateUsernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>;
