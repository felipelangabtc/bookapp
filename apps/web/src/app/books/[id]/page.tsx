
import { prisma } from '@bookapp/db';
import { Badge, RatingStars, Button, Separator } from '@bookapp/ui';
import { BookOpen, Globe, Calendar, Building2, Hash } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';

import { ShelfButton } from '@/components/books/shelf-button';
import { Header } from '@/components/layout/header';
import { ReviewList } from '@/components/reviews/review-list';
import { WriteReviewButton } from '@/components/reviews/write-review-button';
import { authOptions } from '@/lib/auth';

import type { Metadata } from 'next';

interface BookPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const book = await prisma.book.findUnique({
    where: { id: params.id },
  });

  if (!book) {
    return { title: 'Book Not Found' };
  }

  return {
    title: book.title,
    description: book.description?.slice(0, 160) || `${book.title} by ${book.authors.join(', ')}`,
    openGraph: {
      title: book.title,
      description: book.description?.slice(0, 160) || undefined,
      images: book.coverImage ? [{ url: book.coverImage }] : undefined,
    },
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const t = await getTranslations('books');
  const session = await getServerSession(authOptions);

  const book = await prisma.book.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!book) {
    notFound();
  }

  // Get user's shelf entry if logged in
  let userShelfEntry = null;
  let userReview = null;
  if (session?.user) {
    [userShelfEntry, userReview] = await Promise.all([
      prisma.shelfEntry.findUnique({
        where: {
          userId_bookId: {
            userId: session.user.id,
            bookId: book.id,
          },
        },
      }),
      prisma.review.findUnique({
        where: {
          userId_bookId: {
            userId: session.user.id,
            bookId: book.id,
          },
        },
      }),
    ]);
  }

  // Get recent reviews
  const reviews = await prisma.review.findMany({
    where: {
      bookId: book.id,
      isHidden: false,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const defaultCover = 'https://via.placeholder.com/300x450/e2e8f0/64748b?text=No+Cover';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Book Cover and Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-6">
                <Image
                  src={book.coverImage || defaultCover}
                  alt={book.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                  priority
                />
              </div>

              <div className="space-y-4">
                {session?.user ? (
                  <ShelfButton
                    bookId={book.id}
                    currentShelf={userShelfEntry?.shelfType || null}
                  />
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/auth/login?callbackUrl=/books/">
                      Sign in to add to shelf
                    </Link>
                  </Button>
                )}

                {session?.user && !userReview && (
                  <WriteReviewButton bookId={book.id} />
                )}
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Rating */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
              {book.subtitle && (
                <p className="text-xl text-muted-foreground mb-4">{book.subtitle}</p>
              )}

              <p className="text-lg mb-4">
                by{' '}
                {book.authors.map((author, i) => (
                  <span key={author}>
                    <Link
                      href={`/books?q=${encodeURIComponent(author)}`}
                      className="text-primary hover:underline"
                    >
                      {author}
                    </Link>
                    {i < book.authors.length - 1 && ', '}
                  </span>
                ))}
              </p>

              <div className="flex items-center gap-4">
                <RatingStars rating={book.averageRating} size="lg" showValue />
                <span className="text-muted-foreground">
                  {book.ratingsCount} {t('ratings')} · {book.reviewsCount} {t('reviews')}
                </span>
              </div>
            </div>

            {/* Categories */}
            {book.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {book.categories.map(({ category }) => (
                  <Link key={category.id} href={`/books?category=${category.slug}`}>
                    <Badge variant="secondary" className="hover:bg-secondary/80">
                      {category.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Description */}
            {book.description && (
              <div>
                <h2 className="text-xl font-semibold mb-3">{t('description')}</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{book.description}</p>
                </div>
              </div>
            )}

            {/* Book Details */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {book.pageCount && (
                  <DetailItem
                    icon={<BookOpen className="h-4 w-4" />}
                    label={t('pageCount')}
                    value={`${book.pageCount} pages`}
                  />
                )}
                {book.language && (
                  <DetailItem
                    icon={<Globe className="h-4 w-4" />}
                    label={t('language')}
                    value={getLanguageName(book.language)}
                  />
                )}
                {book.publishedDate && (
                  <DetailItem
                    icon={<Calendar className="h-4 w-4" />}
                    label={t('publishedDate')}
                    value={new Date(book.publishedDate).toLocaleDateString()}
                  />
                )}
                {book.publisher && (
                  <DetailItem
                    icon={<Building2 className="h-4 w-4" />}
                    label={t('publisher')}
                    value={book.publisher}
                  />
                )}
                {book.isbn13 && (
                  <DetailItem
                    icon={<Hash className="h-4 w-4" />}
                    label="ISBN-13"
                    value={book.isbn13}
                  />
                )}
                {book.isbn10 && (
                  <DetailItem
                    icon={<Hash className="h-4 w-4" />}
                    label="ISBN-10"
                    value={book.isbn10}
                  />
                )}
              </div>
            </div>

            <Separator />

            {/* Reviews Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">{t('reviews')}</h2>
                {session?.user && userReview && (
                  <Link href={`/books/${book.id}/review`}>
                    <Button variant="outline" size="sm">
                      Edit your review
                    </Button>
                  </Link>
                )}
              </div>

              <ReviewList reviews={reviews} currentUserId={session?.user?.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: 'English',
    pt: 'Portuguese',
    'pt-BR': 'Portuguese (Brazil)',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    ja: 'Japanese',
    zh: 'Chinese',
  };
  return languages[code] || code;
}
