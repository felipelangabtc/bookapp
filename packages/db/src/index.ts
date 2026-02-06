// Re-export Prisma client
export { prisma } from './client';
export type { PrismaClient } from './client';

// Re-export all Prisma types
export type {
  User,
  Account,
  Session,
  VerificationToken,
  PasswordResetToken,
  Book,
  Category,
  BookCategory,
  ShelfEntry,
  ReadingGoal,
  Review,
  ReviewLike,
  ReviewComment,
  Work,
  Chapter,
  ChapterComment,
  ChapterProgress,
  AudioJob,
  AudioFile,
  Subscription,
  UsageRecord,
  Follow,
  Report,
  AuditLog,
} from '@prisma/client';

// Re-export enums
export {
  UserRole,
  ShelfType,
  WorkType,
  WorkStatus,
  ChapterStatus,
  AudioJobStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  ReportStatus,
  ReportType,
} from '@prisma/client';
