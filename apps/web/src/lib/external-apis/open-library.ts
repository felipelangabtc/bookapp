import { logger } from '../logger';

export interface OpenLibraryWork {
  key: string;
  title: string;
  subtitle?: string;
  description?: string | { value: string };
  covers?: number[];
  subjects?: string[];
  subject_places?: string[];
  subject_people?: string[];
  subject_times?: string[];
  first_publish_date?: string;
}

export interface OpenLibraryAuthor {
  key: string;
  name: string;
  personal_name?: string;
  birth_date?: string;
  death_date?: string;
  bio?: string | { value: string };
}

export interface OpenLibraryEdition {
  key: string;
  title: string;
  subtitle?: string;
  authors?: Array<{ key: string }>;
  publishers?: string[];
  publish_date?: string;
  number_of_pages?: number;
  isbn_10?: string[];
  isbn_13?: string[];
  covers?: number[];
  languages?: Array<{ key: string }>;
  description?: string | { value: string };
}

export interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  subtitle?: string;
  author_name?: string[];
  author_key?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  isbn?: string[];
  cover_i?: number;
  language?: string[];
  subject?: string[];
  publisher?: string[];
}

export interface OpenLibrarySearchResult {
  numFound: number;
  start: number;
  docs: OpenLibrarySearchDoc[];
}

const OPEN_LIBRARY_API_BASE =
  process.env.OPEN_LIBRARY_BASE_URL || 'https://openlibrary.org';

export const searchOpenLibrary = async (
  query: string,
  options: {
    page?: number;
    limit?: number;
    language?: string;
  } = {}
): Promise<OpenLibrarySearchResult> => {
  const { page = 1, limit = 20, language } = options;

  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: limit.toString(),
    fields:
      'key,title,subtitle,author_name,author_key,first_publish_year,number_of_pages_median,isbn,cover_i,language,subject,publisher',
  });

  if (language) {
    params.set('language', language);
  }

  const url = `${OPEN_LIBRARY_API_BASE}/search.json?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open Library API error: ${response.status}`);
    }

    return (await response.json()) as OpenLibrarySearchResult;
  } catch (error) {
    logger.error('Open Library API error', {}, error instanceof Error ? error : undefined);
    return { numFound: 0, start: 0, docs: [] };
  }
};

export const getOpenLibraryWork = async (workId: string): Promise<OpenLibraryWork | null> => {
  // Work ID should be like "/works/OL123W" or just "OL123W"
  const id = workId.startsWith('/works/') ? workId : `/works/${workId}`;
  const url = `${OPEN_LIBRARY_API_BASE}${id}.json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Open Library API error: ${response.status}`);
    }

    return (await response.json()) as OpenLibraryWork;
  } catch (error) {
    logger.error('Open Library API error', { workId }, error instanceof Error ? error : undefined);
    return null;
  }
};

export const getOpenLibraryEdition = async (
  editionId: string
): Promise<OpenLibraryEdition | null> => {
  // Edition ID should be like "/books/OL123M" or just "OL123M"
  const id = editionId.startsWith('/books/') ? editionId : `/books/${editionId}`;
  const url = `${OPEN_LIBRARY_API_BASE}${id}.json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Open Library API error: ${response.status}`);
    }

    return (await response.json()) as OpenLibraryEdition;
  } catch (error) {
    logger.error('Open Library API error', { editionId }, error instanceof Error ? error : undefined);
    return null;
  }
};

export const getOpenLibraryAuthor = async (
  authorId: string
): Promise<OpenLibraryAuthor | null> => {
  // Author ID should be like "/authors/OL123A" or just "OL123A"
  const id = authorId.startsWith('/authors/') ? authorId : `/authors/${authorId}`;
  const url = `${OPEN_LIBRARY_API_BASE}${id}.json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Open Library API error: ${response.status}`);
    }

    return (await response.json()) as OpenLibraryAuthor;
  } catch (error) {
    logger.error('Open Library API error', { authorId }, error instanceof Error ? error : undefined);
    return null;
  }
};

// Get cover image URL
export const getOpenLibraryCover = (
  coverId: number,
  size: 'S' | 'M' | 'L' = 'M'
): string => {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
};

// Convert Open Library search result to our format
export const normalizeOpenLibraryBook = (doc: OpenLibrarySearchDoc) => {
  const workId = doc.key?.replace('/works/', '');
  const isbn13 = doc.isbn?.find((isbn) => isbn.length === 13);
  const isbn10 = doc.isbn?.find((isbn) => isbn.length === 10);

  return {
    title: doc.title,
    subtitle: doc.subtitle,
    authors: doc.author_name || ['Unknown'],
    coverImage: doc.cover_i ? getOpenLibraryCover(doc.cover_i, 'L') : undefined,
    language: doc.language?.[0] || 'en',
    publishedDate: doc.first_publish_year
      ? new Date(`${doc.first_publish_year}-01-01`).toISOString()
      : undefined,
    isbn10,
    isbn13,
    pageCount: doc.number_of_pages_median,
    publisher: doc.publisher?.[0],
    categories: doc.subject?.slice(0, 5),
    openLibraryId: workId,
  };
};

// Helper to get description text from Open Library format
export const getDescriptionText = (
  description: string | { value: string } | undefined
): string | undefined => {
  if (!description) return undefined;
  if (typeof description === 'string') return description;
  return description.value;
};
