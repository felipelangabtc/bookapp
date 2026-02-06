'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star, Loader2 } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
  Checkbox,
  RatingInput,
} from '@bookapp/ui';

import { createReviewSchema, type CreateReviewInput } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';

interface WriteReviewButtonProps {
  bookId: string;
}

export function WriteReviewButton({ bookId }: WriteReviewButtonProps) {
  const t = useTranslations('reviews');
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      bookId,
      rating: 0,
      title: '',
      body: '',
      hasSpoilers: false,
    },
  });

  const onSubmit = async (data: CreateReviewInput) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, rating }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit review');
      }

      toast({
        title: 'Review submitted',
        description: 'Thank you for your review!',
      });

      setOpen(false);
      reset();
      setRating(0);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Star className="mr-2 h-4 w-4" />
          {t('writeReview')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{t('writeReview')}</DialogTitle>
            <DialogDescription>
              Share your thoughts about this book with the community.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Rating */}
            <div className="space-y-2">
              <Label>{t('yourRating')}</Label>
              <RatingInput
                value={rating}
                onChange={(value) => {
                  setRating(value);
                  setValue('rating', value);
                }}
              />
              {errors.rating && (
                <p className="text-sm text-destructive">{errors.rating.message}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('reviewTitle')}</Label>
              <Input
                id="title"
                placeholder="Summarize your review..."
                {...register('title')}
                error={errors.title?.message}
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="body">{t('reviewBody')}</Label>
              <Textarea
                id="body"
                placeholder="What did you think of this book?"
                rows={6}
                {...register('body')}
                error={errors.body?.message}
              />
            </div>

            {/* Spoilers */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasSpoilers"
                onCheckedChange={(checked) =>
                  setValue('hasSpoilers', checked === true)
                }
              />
              <Label htmlFor="hasSpoilers" className="text-sm font-normal">
                {t('containsSpoilers')}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || rating === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
