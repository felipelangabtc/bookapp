import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import { Providers } from '@/components/providers';

import type { Metadata } from 'next';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'BookApp - Your Global Reading Community',
    template: '%s | BookApp',
  },
  description:
    'A global social reading and writing platform. Discover books, track your reading, write stories, and connect with readers worldwide.',
  keywords: [
    'books',
    'reading',
    'writing',
    'social reading',
    'book tracking',
    'audiobooks',
    'stories',
  ],
  authors: [{ name: 'BookApp' }],
  creator: 'BookApp',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'BookApp - Your Global Reading Community',
    description:
      'A global social reading and writing platform. Discover books, track your reading, write stories, and connect with readers worldwide.',
    siteName: 'BookApp',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BookApp - Your Global Reading Community',
    description:
      'A global social reading and writing platform. Discover books, track your reading, write stories, and connect with readers worldwide.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
