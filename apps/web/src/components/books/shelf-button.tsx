'use client';

import { ShelfType } from '@bookapp/db';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bookapp/ui';
import {
  BookmarkPlus,
  BookOpen,
  BookCheck,
  BookX,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useToast } from '@/hooks/use-toast';

interface ShelfButtonProps {
  bookId: string;
  currentShelf: ShelfType | null;
}

const shelfOptions = [
  { value: ShelfType.WANT_TO_READ, label: 'Want to Read', icon: BookmarkPlus },
  { value: ShelfType.READING, label: 'Currently Reading', icon: BookOpen },
  { value: ShelfType.READ, label: 'Read', icon: BookCheck },
  { value: ShelfType.ABANDONED, label: 'Abandoned', icon: BookX },
] as const;

export function ShelfButton({ bookId, currentShelf }: ShelfButtonProps) {
  const t = useTranslations('shelves');
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shelf, setShelf] = useState<ShelfType | null>(currentShelf);

  const handleShelfChange = async (newShelf: ShelfType | null) => {
    if (!session?.user) return;

    setIsLoading(true);
    try {
      if (newShelf === null) {
        // Remove from shelf
        const response = await fetch(`/api/shelves/${bookId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to remove from shelf');
        }

        setShelf(null);
        toast({
          title: 'Removed',
          description: 'Book removed from your shelf',
        });
      } else {
        // Add or update shelf
        const response = await fetch('/api/shelves', {
          method: shelf ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId,
            shelfType: newShelf,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update shelf');
        }

        setShelf(newShelf);
        toast({
          title: 'Updated',
          description: `Book added to "${shelfOptions.find((o) => o.value === newShelf)?.label}"`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update shelf',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentOption = shelf
    ? shelfOptions.find((o) => o.value === shelf)
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : currentOption ? (
            <currentOption.icon className="mr-2 h-4 w-4" />
          ) : (
            <BookmarkPlus className="mr-2 h-4 w-4" />
          )}
          {currentOption ? currentOption.label : t('addToShelf')}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {shelfOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleShelfChange(option.value)}
            className={shelf === option.value ? 'bg-muted' : ''}
          >
            <option.icon className="mr-2 h-4 w-4" />
            {option.label}
          </DropdownMenuItem>
        ))}
        {shelf && (
          <>
            <DropdownMenuItem
              onClick={() => handleShelfChange(null)}
              className="text-destructive"
            >
              <BookX className="mr-2 h-4 w-4" />
              {t('removeFromShelf')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
