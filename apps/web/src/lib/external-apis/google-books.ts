import { logger } from '../logger';

export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: 'ISBN_10' | 'ISBN_13' | string;
      identifier: string;
    }>;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
    };
    language?: string;
  };
}

export interface GoogleBooksSearchResult {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1';

const getApiKey = (): string | undefined => {
  return process.env.GOOGLE_BOOKS_API_KEY;
};

export const searchGoogleBooks = async (
  query: string,
  options: {
    startIndex?: number;
    maxResults?: number;
    langRestrict?: string;
  } = {}
): Promise<GoogleBooksSearchResult> => {
  const { startIndex = 0, maxResults = 20, langRestrict } = options;

  const params = new URLSearchParams({
    q: query,
    startIndex: startIndex.toString(),
    maxResults: Math.min(maxResults, 40).toString(),
    printType: 'books',
  });

  if (langRestrict) {
    params.set('langRestrict', langRestrict);
  }

  const apiKey = getApiKey();
  if (apiKey) {
    params.set('key', apiKey);
  }

  const url = `${GOOGLE_BOOKS_API_BASE}/volumes?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data = await response.json();
    return data as GoogleBooksSearchResult;
  } catch (error) {
    logger.error('Google Books API error', {}, error instanceof Error ? error : undefined);
    return { totalItems: 0 };
  }
};

export const getGoogleBook = async (volumeId: string): Promise<GoogleBooksVolume | null> => {
  const params = new URLSearchParams();
  const apiKey = getApiKey();
  if (apiKey) {
    params.set('key', apiKey);
  }

  const url = `${GOOGLE_BOOKS_API_BASE}/volumes/${volumeId}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Google Books API error: ${response.status}`);
    }

    return (await response.json()) as GoogleBooksVolume;
  } catch (error) {
    logger.error('Google Books API error', { volumeId }, error instanceof Error ? error : undefined);
    return null;
  }
};

// Convert Google Books data to our book format
export const normalizeGoogleBook = (volume: GoogleBooksVolume) => {
  const info = volume.volumeInfo;
  const isbn10 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_10')?.identifier;
  const isbn13 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier;

  // Get the best available image
  const coverImage =
    info.imageLinks?.large ||
    info.imageLinks?.medium ||
    info.imageLinks?.thumbnail?.replace('zoom=1', 'zoom=2') ||
    info.imageLinks?.smallThumbnail?.replace('zoom=5', 'zoom=2');

  return {
    title: info.title,
    subtitle: info.subtitle,
    description: info.description,
    authors: info.authors || ['Unknown'],
    coverImage: coverImage?.replace('http://', 'https://'),
    language: info.language || 'en',
    publishedDate: info.publishedDate
      ? new Date(info.publishedDate).toISOString()
      : undefined,
    isbn10,
    isbn13,
    pageCount: info.pageCount,
    publisher: info.publisher,
    categories: info.categories,
    googleBooksId: volume.id,
  };
};
