import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BookOpen, Pencil, Headphones, Users, Star, Globe } from 'lucide-react';

import { Button } from '@bookapp/ui';

import { Header } from '@/components/layout/header';

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Your Global Reading{' '}
                <span className="text-primary">Community</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover books, track your reading journey, write your own
                stories, and connect with readers from around the world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/auth/register">Get Started Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/books">Browse Books</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-1/4 left-10 w-20 h-20 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything You Need for Your Reading Journey
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<BookOpen className="h-8 w-8" />}
                title="Track Your Reading"
                description="Organize your books into shelves, track your progress, and set reading goals. Never lose track of what you've read."
              />
              <FeatureCard
                icon={<Star className="h-8 w-8" />}
                title="Reviews & Ratings"
                description="Share your thoughts with the community. Rate books, write reviews, and discover what others are reading."
              />
              <FeatureCard
                icon={<Globe className="h-8 w-8" />}
                title="Global Catalog"
                description="Access millions of books from around the world. Search by title, author, ISBN, or category."
              />
              <FeatureCard
                icon={<Pencil className="h-8 w-8" />}
                title="Write & Publish"
                description="Share your stories with the world. Write chapters, publish your work, and build your audience."
              />
              <FeatureCard
                icon={<Headphones className="h-8 w-8" />}
                title="AI Audiobooks"
                description="Transform your stories into audiobooks with AI-powered text-to-speech. Multiple voices and languages available."
              />
              <FeatureCard
                icon={<Users className="h-8 w-8" />}
                title="Connect & Discover"
                description="Follow your favorite authors and readers. Get personalized recommendations based on your tastes."
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <StatCard value="1M+" label="Books" />
              <StatCard value="100K+" label="Active Readers" />
              <StatCard value="50K+" label="Reviews" />
              <StatCard value="10K+" label="Original Works" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your Reading Journey?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of readers and writers from around the world.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/auth/register">Create Free Account</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">BookApp</h3>
              <p className="text-sm text-muted-foreground">
                Your global reading community. Discover, track, write, and
                connect.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Explore</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/books" className="hover:text-foreground">
                    Browse Books
                  </Link>
                </li>
                <li>
                  <Link href="/works" className="hover:text-foreground">
                    Discover Stories
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="hover:text-foreground">
                    Categories
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-foreground">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} BookApp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-primary mb-2">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}
