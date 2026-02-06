import { Skeleton } from '@bookapp/ui';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { BookFilters } from '@/components/books/book-filters';
import { BookGrid } from '@/components/books/book-grid';
import { BookSearch } from '@/components/books/book-search';
import { Header } from '@/components/layout/header';


import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Books',
  description: 'Browse and discover books from around the world',
};

interface BooksPageProps {
  searchParams: {
    q?: string;
    page?: string;
    category?: string;
    language?: string;
  };
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const t = await getTranslations('books');

  const query = searchParams.q || '';
  const page = parseInt(searchParams.page || '1');
  const category = searchParams.category || '';
  const language = searchParams.language || '';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <BookFilters
              selectedCategory={category}
              selectedLanguage={language}
            />
          </aside>

          {/* Main content */}
          <div className="flex-1">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
              <BookSearch initialQuery={query} />
            </div>

            <Suspense fallback={<BookGridSkeleton />}>
              <BookGrid
                query={query}
                page={page}
                category={category}
                language={language}
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

function BookGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[2/3] rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
