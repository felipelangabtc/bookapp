import { z } from 'zod';

import { WorkType, WorkStatus, ChapterStatus } from '@bookapp/db';

const workTypeValues = Object.values(WorkType) as [WorkType, ...WorkType[]];
const workStatusValues = Object.values(WorkStatus) as [WorkStatus, ...WorkStatus[]];
const chapterStatusValues = Object.values(ChapterStatus) as [ChapterStatus, ...ChapterStatus[]];

export const createWorkSchema = z.object({
  type: z.enum(workTypeValues),
  title: z.string().min(1, 'Title is required').max(200),
  synopsis: z.string().max(5000).optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  language: z.string().default('en'),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateWorkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  synopsis: z.string().max(5000).nullable().optional(),
  coverImage: z.string().url().nullable().optional().or(z.literal('')),
  language: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  status: z.enum(workStatusValues).optional(),
});

export const createChapterSchema = z.object({
  workId: z.string().min(1, 'Work ID is required'),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(100000),
  order: z.number().int().min(1).optional(),
  status: z.enum(chapterStatusValues).default('DRAFT'),
});

export const updateChapterSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  content: z.string().min(1, 'Content is required').max(100000).optional(),
  order: z.number().int().min(1).optional(),
  status: z.enum(chapterStatusValues).optional(),
});

export const createChapterCommentSchema = z.object({
  chapterId: z.string().min(1, 'Chapter ID is required'),
  parentId: z.string().optional(),
  body: z.string().min(1, 'Comment cannot be empty').max(5000),
  hasSpoilers: z.boolean().default(false),
});

export const updateChapterProgressSchema = z.object({
  chapterId: z.string().min(1, 'Chapter ID is required'),
  progressPercent: z.number().min(0).max(100),
});

export type CreateWorkInput = z.infer<typeof createWorkSchema>;
export type UpdateWorkInput = z.infer<typeof updateWorkSchema>;
export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
export type CreateChapterCommentInput = z.infer<typeof createChapterCommentSchema>;
export type UpdateChapterProgressInput = z.infer<typeof updateChapterProgressSchema>;
