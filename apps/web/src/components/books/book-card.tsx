'use client';

import { Badge } from '@bookapp/ui';
import Image from 'next/image';
import Link from 'next/link';


import type { Book, BookCategory, Category } from '@bookapp/db';

interface BookCardProps {
  book: Book & {
    categories: (BookCategory & { category: Category })[];
  };
}

export function BookCard({ book }: BookCardProps) {
  const defaultCover = 'https://via.placeholder.com/200x300/e2e8f0/64748b?text=No+Cover';

  return (
    <Link
      href={`/books/${book.id}`}
      className="group block"
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-3">
        <Image
          src={book.coverImage || defaultCover}
          alt={book.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {book.averageRating > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <span className="text-yellow-400">★</span>
            {book.averageRating.toFixed(1)}
          </div>
        )}
      </div>

      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
        {book.title}
      </h3>

      {book.authors.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {book.authors.join(', ')}
        </p>
      )}

      {book.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {book.categories.slice(0, 2).map(({ category }) => (
            <Badge key={category.id} variant="secondary" className="text-xs px-1.5 py-0">
              {category.name}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  );
}
