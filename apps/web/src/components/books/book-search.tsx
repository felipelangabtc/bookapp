'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';

import { Button, Input } from '@bookapp/ui';

interface BookSearchProps {
  initialQuery: string;
}

export function BookSearch({ initialQuery }: BookSearchProps) {
  const t = useTranslations('books');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }

    params.delete('page'); // Reset to page 1 on new search

    startTransition(() => {
      router.push(`/books?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setQuery('');

    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    params.delete('page');

    startTransition(() => {
      router.push(`/books?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('searchBooks')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Searching...' : t('search')}
      </Button>
    </form>
  );
}
