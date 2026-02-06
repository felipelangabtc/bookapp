'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, MessageSquare, Flag, Languages, AlertTriangle } from 'lucide-react';

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Button,
  RatingStars,
} from '@bookapp/ui';

import type { Review, User } from '@bookapp/db';

type ReviewWithUser = Review & {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>;
  _count: {
    likes: number;
    comments: number;
  };
};

interface ReviewListProps {
  reviews: ReviewWithUser[];
  currentUserId?: string;
}

export function ReviewList({ reviews, currentUserId }: ReviewListProps) {
  const t = useTranslations('reviews');

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('noReviews')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          isOwner={currentUserId === review.userId}
        />
      ))}
    </div>
  );
}

interface ReviewCardProps {
  review: ReviewWithUser;
  isOwner: boolean;
}

function ReviewCard({ review, isOwner }: ReviewCardProps) {
  const t = useTranslations('reviews');
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(review._count.likes);

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/reviews/${review.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
      }
    } catch (error) {
      console.error('Failed to like review:', error);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Link
          href={`/profile/${review.user.username}`}
          className="flex items-center gap-3 hover:opacity-80"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.user.avatar || undefined} />
            <AvatarFallback>
              {(review.user.displayName || review.user.username)
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {review.user.displayName || review.user.username}
            </div>
            <div className="text-sm text-muted-foreground">
              @{review.user.username}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <RatingStars rating={review.rating} size="sm" showValue />
          {review.detectedLanguage && review.detectedLanguage !== 'en' && (
            <Badge variant="outline" className="text-xs">
              {review.detectedLanguage.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <h3 className="font-semibold mb-2">{review.title}</h3>
      )}

      {/* Spoiler Warning */}
      {review.hasSpoilers && !showSpoiler && (
        <div className="bg-muted p-4 rounded-lg mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('spoilerWarning')}</span>
          </div>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto mt-2"
            onClick={() => setShowSpoiler(true)}
          >
            {t('showSpoiler')}
          </Button>
        </div>
      )}

      {/* Body */}
      {review.body && (!review.hasSpoilers || showSpoiler) && (
        <div
          className={`prose prose-sm max-w-none mb-4 ${
            review.hasSpoilers ? 'relative' : ''
          }`}
        >
          <p className="whitespace-pre-wrap">{review.body}</p>
          {review.hasSpoilers && showSpoiler && (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto"
              onClick={() => setShowSpoiler(false)}
            >
              {t('hideSpoiler')}
            </Button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 hover:text-foreground ${
              isLiked ? 'text-primary' : ''
            }`}
          >
            <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            {likesCount}
          </button>

          <Link
            href={`/reviews/${review.id}`}
            className="flex items-center gap-1 hover:text-foreground"
          >
            <MessageSquare className="h-4 w-4" />
            {review._count.comments}
          </Link>

          <button className="flex items-center gap-1 hover:text-foreground">
            <Languages className="h-4 w-4" />
            {t('translate')}
          </button>

          {!isOwner && (
            <button className="flex items-center gap-1 hover:text-destructive">
              <Flag className="h-4 w-4" />
              {t('report')}
            </button>
          )}
        </div>

        <span>
          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
