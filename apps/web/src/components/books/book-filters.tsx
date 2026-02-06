'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from '@bookapp/ui';

interface BookFiltersProps {
  selectedCategory: string;
  selectedLanguage: string;
}

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'fiction', label: 'Fiction' },
  { value: 'non-fiction', label: 'Non-Fiction' },
  { value: 'science-fiction', label: 'Science Fiction' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'romance', label: 'Romance' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'horror', label: 'Horror' },
  { value: 'biography', label: 'Biography' },
  { value: 'self-help', label: 'Self-Help' },
  { value: 'young-adult', label: 'Young Adult' },
  { value: 'poetry', label: 'Poetry' },
];

const languages = [
  { value: '', label: 'All Languages' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

export function BookFilters({
  selectedCategory,
  selectedLanguage,
}: BookFiltersProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.delete('page'); // Reset to page 1

    startTransition(() => {
      router.push(`/books?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    const query = searchParams.get('q');
    if (query) {
      params.set('q', query);
    }

    startTransition(() => {
      router.push(`/books?${params.toString()}`);
    });
  };

  const hasFilters = selectedCategory || selectedLanguage;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('filter')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select
            value={selectedCategory}
            onValueChange={(value) => updateFilter('category', value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Language</label>
          <Select
            value={selectedLanguage}
            onValueChange={(value) => updateFilter('language', value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={clearFilters}
            disabled={isPending}
          >
            Clear Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
