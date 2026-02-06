import { NextRequest } from 'next/server';

import { prisma, ShelfType } from '@bookapp/db';

import {
  apiSuccess,
  errors,
  requireAuth,
  validateBody,
  withApiHandler,
} from '@/lib/api-utils';
import { addToShelfSchema, updateShelfEntrySchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Get user's shelf entries
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const shelfType = searchParams.get('shelfType') as ShelfType | null;

  try {
    const where: Record<string, unknown> = { userId: session!.user.id };

    if (shelfType && Object.values(ShelfType).includes(shelfType)) {
      where.shelfType = shelfType;
    }

    const entries = await prisma.shelfEntry.findMany({
      where,
      include: {
        book: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return apiSuccess(entries);
  } catch (error) {
    logger.error('Failed to fetch shelf entries', {}, error instanceof Error ? error : undefined);
    return errors.internal('Failed to fetch shelf entries');
  }
}

// Add book to shelf
export const POST = withApiHandler(async (request: Request) => {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  // Rate limiting
  const rateLimit = await checkRateLimit(session!.user.id, 'api');
  if (!rateLimit.success) {
    return errors.rateLimited();
  }

  const { data, error } = await validateBody(request, addToShelfSchema);
  if (error) return error;

  try {
    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: data.bookId },
    });

    if (!book) {
      return errors.notFound('Book');
    }

    // Check if entry already exists
    const existingEntry = await prisma.shelfEntry.findUnique({
      where: {
        userId_bookId: {
          userId: session!.user.id,
          bookId: data.bookId,
        },
      },
    });

    if (existingEntry) {
      return errors.badRequest('Book is already on your shelf');
    }

    const entry = await prisma.shelfEntry.create({
      data: {
        userId: session!.user.id,
        bookId: data.bookId,
        shelfType: data.shelfType,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        progressPages: data.progressPages,
        progressPercent: data.progressPercent,
        notes: data.notes,
        tags: data.tags || [],
      },
      include: {
        book: true,
      },
    });

    // Update reading goal if marking as read
    if (data.shelfType === ShelfType.READ) {
      const now = new Date();
      await prisma.readingGoal.upsert({
        where: {
          userId_year_month: {
            userId: session!.user.id,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          },
        },
        update: {
          completed: { increment: 1 },
        },
        create: {
          userId: session!.user.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          targetBooks: 4,
          completed: 1,
        },
      });
    }

    logger.info('Book added to shelf', {
      userId: session!.user.id,
      bookId: data.bookId,
      shelfType: data.shelfType,
    });

    return apiSuccess(entry, 'Book added to shelf', 201);
  } catch (error) {
    logger.error('Failed to add book to shelf', {}, error instanceof Error ? error : undefined);
    return errors.internal('Failed to add book to shelf');
  }
});

// Update shelf entry
export const PATCH = withApiHandler(async (request: Request) => {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { data, error } = await validateBody(
    request,
    updateShelfEntrySchema.extend({ bookId: addToShelfSchema.shape.bookId })
  );
  if (error) return error;

  try {
    const existingEntry = await prisma.shelfEntry.findUnique({
      where: {
        userId_bookId: {
          userId: session!.user.id,
          bookId: data.bookId,
        },
      },
    });

    if (!existingEntry) {
      return errors.notFound('Shelf entry');
    }

    const wasRead = existingEntry.shelfType === ShelfType.READ;
    const willBeRead = data.shelfType === ShelfType.READ;

    const entry = await prisma.shelfEntry.update({
      where: {
        userId_bookId: {
          userId: session!.user.id,
          bookId: data.bookId,
        },
      },
      data: {
        shelfType: data.shelfType,
        startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
        endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
        progressPages: data.progressPages,
        progressPercent: data.progressPercent,
        notes: data.notes,
        tags: data.tags,
      },
      include: {
        book: true,
      },
    });

    // Update reading goal if shelf type changed to/from READ
    if (!wasRead && willBeRead) {
      const now = new Date();
      await prisma.readingGoal.upsert({
        where: {
          userId_year_month: {
            userId: session!.user.id,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          },
        },
        update: {
          completed: { increment: 1 },
        },
        create: {
          userId: session!.user.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          targetBooks: 4,
          completed: 1,
        },
      });
    } else if (wasRead && !willBeRead) {
      const now = new Date();
      await prisma.readingGoal.updateMany({
        where: {
          userId: session!.user.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          completed: { gt: 0 },
        },
        data: {
          completed: { decrement: 1 },
        },
      });
    }

    logger.info('Shelf entry updated', {
      userId: session!.user.id,
      bookId: data.bookId,
    });

    return apiSuccess(entry, 'Shelf entry updated');
  } catch (error) {
    logger.error('Failed to update shelf entry', {}, error instanceof Error ? error : undefined);
    return errors.internal('Failed to update shelf entry');
  }
});
