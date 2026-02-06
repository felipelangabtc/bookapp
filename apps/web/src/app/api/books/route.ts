import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@bookapp/db';

import {
  apiSuccess,
  errors,
  requireAuth,
  validateBody,
  withApiHandler,
} from '@/lib/api-utils';
import { createBookSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

// Search/list books
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const language = searchParams.get('language') || undefined;
  const category = searchParams.get('category') || undefined;
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { authors: { has: query } },
        { isbn10: query },
        { isbn13: query },
      ];
    }

    if (language) {
      where.language = language;
    }

    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      }),
      prisma.book.count({ where }),
    ]);

    return apiSuccess({
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch books', {}, error instanceof Error ? error : undefined);
    return errors.internal('Failed to fetch books');
  }
}

// Create a new book
export const POST = withApiHandler(async (request: Request) => {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { data, error } = await validateBody(request, createBookSchema);
  if (error) return error;

  try {
    // Check for duplicates by ISBN
    if (data.isbn10 || data.isbn13) {
      const existing = await prisma.book.findFirst({
        where: {
          OR: [
            ...(data.isbn10 ? [{ isbn10: data.isbn10 }] : []),
            ...(data.isbn13 ? [{ isbn13: data.isbn13 }] : []),
          ],
        },
      });

      if (existing) {
        return errors.badRequest('A book with this ISBN already exists');
      }
    }

    const book = await prisma.book.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        authors: data.authors,
        coverImage: data.coverImage || null,
        language: data.language,
        publishedDate: data.publishedDate ? new Date(data.publishedDate) : null,
        isbn10: data.isbn10 || null,
        isbn13: data.isbn13 || null,
        pageCount: data.pageCount,
        publisher: data.publisher,
        createdById: session!.user.id,
        categories: data.categories
          ? {
              create: await Promise.all(
                data.categories.map(async (categoryName) => {
                  // Find or create category
                  const category = await prisma.category.upsert({
                    where: { slug: categoryName.toLowerCase().replace(/\s+/g, '-') },
                    create: {
                      name: categoryName,
                      slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
                    },
                    update: {},
                  });
                  return { categoryId: category.id };
                })
              ),
            }
          : undefined,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    logger.info('Book created', { bookId: book.id, userId: session!.user.id });

    return apiSuccess(book, 'Book created successfully', 201);
  } catch (error) {
    logger.error('Failed to create book', {}, error instanceof Error ? error : undefined);
    return errors.internal('Failed to create book');
  }
});
