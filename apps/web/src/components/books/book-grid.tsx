import { prisma } from '@bookapp/db';

import { Pagination } from '@/components/pagination';

import { BookCard } from './book-card';

interface BookGridProps {
  query: string;
  page: number;
  category: string;
  language: string;
}

export async function BookGrid({
  query,
  page,
  category,
  language,
}: BookGridProps) {
  const limit = 20;
  const skip = (page - 1) * limit;

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
      orderBy: { createdAt: 'desc' },
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

  const totalPages = Math.ceil(total / limit);

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No books found</p>
        {query && (
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search or browse all books
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {skip + 1}-{Math.min(skip + limit, total)} of {total} books
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/books"
          />
        </div>
      )}
    </div>
  );
}
