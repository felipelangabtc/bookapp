import { prisma } from '@bookapp/db';
import { type NextRequest } from 'next/server';


import {
  apiSuccess,
  errors,
  requireAuth,
  validateBody,
  withApiHandler,
} from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { detectLanguageSimple } from '@/lib/services/translation';
import { createReviewSchema } from '@/lib/validations';

// Get reviews (with optional filters)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookId = searchParams.get('bookId');
  const userId = searchParams.get('userId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = { isHidden: false };

    if (bookId) {
      where.bookId = bookId;
    }

    if (userId) {
      where.userId = userId;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              coverImage: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return apiSuccess({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch reviews', {}, error instanceof Error ? error : undefined);
    return errors.internal('Failed to fetch reviews');
  }
}

// Create a new review
export const POST = withApiHandler(async (request: Request) => {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  // Rate limiting
  const rateLimit = await checkRateLimit(session!.user.id, 'review');
  if (!rateLimit.success) {
    return errors.rateLimited();
  }

  const { data, error } = await validateBody(request, createReviewSchema);
  if (error) return error;

  try {
    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: data.bookId },
    });

    if (!book) {
      return errors.notFound('Book');
    }

    // Check if user already reviewed this book
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_bookId: {
          userId: session!.user.id,
          bookId: data.bookId,
        },
      },
    });

    if (existingReview) {
      return errors.badRequest('You have already reviewed this book');
    }

    // Detect language if body is provided
    let detectedLanguage = 'en';
    if (data.body) {
      detectedLanguage = detectLanguageSimple(data.body);
    }

    const review = await prisma.review.create({
      data: {
        userId: session!.user.id,
        bookId: data.bookId,
        rating: data.rating,
        title: data.title,
        body: data.body,
        hasSpoilers: data.hasSpoilers,
        detectedLanguage,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Update book rating stats
    const stats = await prisma.review.aggregate({
      where: { bookId: data.bookId, isHidden: false },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.book.update({
      where: { id: data.bookId },
      data: {
        averageRating: stats._avg.rating || 0,
        ratingsCount: stats._count,
        reviewsCount: stats._count,
      },
    });

    logger.info('Review created', {
      userId: session!.user.id,
      bookId: data.bookId,
      rating: data.rating,
    });

    return apiSuccess(review, 'Review submitted successfully', 201);
  } catch (error) {
    logger.error('Failed to create review', {}, error instanceof Error ? error : undefined);
    return errors.internal('Failed to create review');
  }
});
