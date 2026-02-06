import { NextRequest, NextResponse } from 'next/server';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory store for development
const tokenBuckets = new Map<string, { count: number; lastReset: number }>();

// Simple in-memory rate limiter (for development)
// In production, use Redis or Upstash
const inMemoryRateLimit = (
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult => {
  const now = Date.now();
  const bucket = tokenBuckets.get(key);

  if (!bucket || now - bucket.lastReset > windowMs) {
    tokenBuckets.set(key, { count: 1, lastReset: now });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  if (bucket.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: bucket.lastReset + windowMs,
    };
  }

  bucket.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - bucket.count,
    reset: bucket.lastReset + windowMs,
  };
};

// Rate limit configurations for different endpoints
export const rateLimitConfigs = {
  auth: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  register: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
  passwordReset: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
  review: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 reviews per hour
  comment: { limit: 30, windowMs: 60 * 60 * 1000 }, // 30 comments per hour
  translation: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 translations per hour
  audiobook: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 generations per hour
  api: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
};

export type RateLimitType = keyof typeof rateLimitConfigs;

export const checkRateLimit = async (
  identifier: string,
  type: RateLimitType
): Promise<RateLimitResult> => {
  const config = rateLimitConfigs[type];
  const key = `ratelimit:${type}:${identifier}`;

  // Check if rate limiting is disabled
  if (process.env.RATE_LIMIT_ENABLED !== 'true') {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: Date.now() + config.windowMs,
    };
  }

  // TODO: In production, use Redis/Upstash
  // For now, use in-memory rate limiting
  return inMemoryRateLimit(key, config.limit, config.windowMs);
};

export const rateLimitMiddleware = (type: RateLimitType) => {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Get identifier (IP or user ID from session)
    const identifier =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const result = await checkRateLimit(identifier, type);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // Continue to handler
  };
};

// Helper to add rate limit headers to response
export const addRateLimitHeaders = (
  response: NextResponse,
  result: RateLimitResult
): NextResponse => {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  return response;
};
