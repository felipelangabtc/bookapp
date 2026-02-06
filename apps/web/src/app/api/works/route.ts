import { prisma, WorkStatus } from '@bookapp/db';
import { type NextRequest } from 'next/server';


import {
  apiSuccess,
  errors,
  requireAuthor,
  validateBody,
  withApiHandler,
} from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { createWorkSchema } from '@/lib/validations';

// Get works (public published works or user's own works)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const authorId = searchParams.get('authorId');
  const type = searchParams.get('type');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = {
      status: WorkStatus.PUBLISHED,
    };

    if (authorId) {
      where.authorId = authorId;
    }

    if (type) {
      where.type = type;
    }

    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              chapters: true,
            },
          },
        },
      }),
      prisma.work.count({ where }),
    ]);

    return apiSuccess({
      works,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch works', {}, error instanceof Error ? error : undefined);
    return errors.internal('Failed to fetch works');
  }
}

// Create a new work (author/admin only)
export const POST = withApiHandler(async (request: Request) => {
  const { session, error: authError } = await requireAuthor();
  if (authError) return authError;

  const { data, error } = await validateBody(request, createWorkSchema);
  if (error) return error;

  try {
    const work = await prisma.work.create({
      data: {
        authorId: session!.user.id,
        type: data.type,
        title: data.title,
        synopsis: data.synopsis,
        coverImage: data.coverImage || null,
        language: data.language,
        tags: data.tags || [],
        status: WorkStatus.DRAFT,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    logger.info('Work created', {
      userId: session!.user.id,
      workId: work.id,
      type: work.type,
    });

    return apiSuccess(work, 'Work created successfully', 201);
  } catch (error) {
    logger.error('Failed to create work', {}, error instanceof Error ? error : undefined);
    return errors.internal('Failed to create work');
  }
});
