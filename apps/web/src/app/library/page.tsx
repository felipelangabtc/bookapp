import { prisma, ShelfType } from '@bookapp/db';
import { Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, Progress } from '@bookapp/ui';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';



import { BookCard } from '@/components/books/book-card';
import { Header } from '@/components/layout/header';
import { authOptions } from '@/lib/auth';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Library',
  description: 'Track your reading progress and manage your book shelves',
};

export default async function LibraryPage() {
  const t = await getTranslations('shelves');
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/library');
  }

  const [shelfEntries, readingGoal] = await Promise.all([
    prisma.shelfEntry.findMany({
      where: { userId: session.user.id },
      include: {
        book: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.readingGoal.findFirst({
      where: {
        userId: session.user.id,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      },
    }),
  ]);

  // Group entries by shelf type
  const shelves = {
    [ShelfType.WANT_TO_READ]: shelfEntries.filter((e) => e.shelfType === ShelfType.WANT_TO_READ),
    [ShelfType.READING]: shelfEntries.filter((e) => e.shelfType === ShelfType.READING),
    [ShelfType.READ]: shelfEntries.filter((e) => e.shelfType === ShelfType.READ),
    [ShelfType.ABANDONED]: shelfEntries.filter((e) => e.shelfType === ShelfType.ABANDONED),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

            <Tabs defaultValue="reading" className="w-full">
              <TabsList className="w-full justify-start mb-6 flex-wrap h-auto gap-2">
                <TabsTrigger value="reading" className="gap-2">
                  {t('reading')}
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {shelves[ShelfType.READING].length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="want_to_read" className="gap-2">
                  {t('wantToRead')}
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {shelves[ShelfType.WANT_TO_READ].length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="read" className="gap-2">
                  {t('read')}
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {shelves[ShelfType.READ].length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="abandoned" className="gap-2">
                  {t('abandoned')}
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {shelves[ShelfType.ABANDONED].length}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reading">
                <ShelfGrid
                  entries={shelves[ShelfType.READING]}
                  emptyMessage="No books currently being read"
                />
              </TabsContent>

              <TabsContent value="want_to_read">
                <ShelfGrid
                  entries={shelves[ShelfType.WANT_TO_READ]}
                  emptyMessage="No books in your want to read list"
                />
              </TabsContent>

              <TabsContent value="read">
                <ShelfGrid
                  entries={shelves[ShelfType.READ]}
                  emptyMessage="No books marked as read"
                />
              </TabsContent>

              <TabsContent value="abandoned">
                <ShelfGrid
                  entries={shelves[ShelfType.ABANDONED]}
                  emptyMessage="No abandoned books"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 shrink-0">
            {/* Reading Goal */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">{t('readingGoal')}</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t('booksThisMonth')}</span>
                      <span className="font-medium">
                        {readingGoal?.completed || 0} / {readingGoal?.targetBooks || 4}
                      </span>
                    </div>
                    <Progress
                      value={((readingGoal?.completed || 0) / (readingGoal?.targetBooks || 4)) * 100}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {t('goalProgress', {
                      completed: readingGoal?.completed || 0,
                      target: readingGoal?.targetBooks || 4,
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Your Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Books</span>
                    <span className="font-medium">{shelfEntries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Books Read</span>
                    <span className="font-medium">{shelves[ShelfType.READ].length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currently Reading</span>
                    <span className="font-medium">{shelves[ShelfType.READING].length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

interface ShelfGridProps {
  entries: Array<{
    book: Parameters<typeof BookCard>[0]['book'];
    progressPercent: number | null;
  }>;
  emptyMessage: string;
}

function ShelfGrid({ entries, emptyMessage }: ShelfGridProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {entries.map(({ book, progressPercent }) => (
        <div key={book.id} className="relative">
          <BookCard book={book} />
          {progressPercent !== null && progressPercent > 0 && progressPercent < 100 && (
            <div className="mt-2">
              <Progress value={progressPercent} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(progressPercent)}% complete
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
