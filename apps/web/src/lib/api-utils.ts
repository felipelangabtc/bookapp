import { UserRole } from '@bookapp/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError, type ZodSchema } from 'zod';

import { authOptions } from './auth';
import { logger, generateRequestId } from './logger';


export interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  data: T;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// Standard API response helpers
export const apiSuccess = <T>(data: T, message?: string, status = 200): NextResponse => {
  const response: ApiSuccess<T> = { data };
  if (message) response.message = message;
  return NextResponse.json(response, { status });
};

export const apiError = (
  error: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse => {
  const response: ApiError = { error, message };
  if (details) response.details = details;
  return NextResponse.json(response, { status });
};

// Common error responses
export const errors = {
  unauthorized: () =>
    apiError('UNAUTHORIZED', 'You must be signed in to access this resource', 401),
  forbidden: () =>
    apiError('FORBIDDEN', 'You do not have permission to access this resource', 403),
  notFound: (resource = 'Resource') =>
    apiError('NOT_FOUND', `${resource} not found`, 404),
  badRequest: (message: string, details?: unknown) =>
    apiError('BAD_REQUEST', message, 400, details),
  validation: (errors: unknown) =>
    apiError('VALIDATION_ERROR', 'Validation failed', 400, errors),
  internal: (message = 'An internal error occurred') =>
    apiError('INTERNAL_ERROR', message, 500),
  rateLimited: (retryAfter?: number) =>
    apiError(
      'RATE_LIMITED',
      'Too many requests. Please try again later.',
      429,
      retryAfter ? { retryAfter } : undefined
    ),
};

// Validate request body with Zod schema
export const validateBody = async <T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> => {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        data: null,
        error: errors.validation(
          err.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          }))
        ),
      };
    }
    if (err instanceof SyntaxError) {
      return {
        data: null,
        error: errors.badRequest('Invalid JSON in request body'),
      };
    }
    return { data: null, error: errors.internal() };
  }
};

// Validate query params with Zod schema
export const validateQuery = <T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } => {
  try {
    const params: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      const existing = params[key];
      if (existing) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          params[key] = [existing, value];
        }
      } else {
        params[key] = value;
      }
    });
    const data = schema.parse(params);
    return { data, error: null };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        data: null,
        error: errors.validation(
          err.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          }))
        ),
      };
    }
    return { data: null, error: errors.internal() };
  }
};

// Get authenticated user session
export const getSession = async () => {
  return getServerSession(authOptions);
};

// Require authentication middleware
export const requireAuth = async () => {
  const session = await getSession();
  if (!session?.user) {
    return { session: null, error: errors.unauthorized() };
  }
  return { session, error: null };
};

// Require specific role
export const requireRole = async (allowedRoles: UserRole[]) => {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  if (!allowedRoles.includes(session!.user.role)) {
    return { session: null, error: errors.forbidden() };
  }

  return { session, error: null };
};

// Require admin role
export const requireAdmin = async () => {
  return requireRole([UserRole.ADMIN]);
};

// Require author or admin role
export const requireAuthor = async () => {
  return requireRole([UserRole.AUTHOR, UserRole.ADMIN]);
};

// API handler wrapper with error handling and logging
export const withApiHandler = <T>(
  handler: (
    request: Request,
    context: { params: Record<string, string> }
  ) => Promise<NextResponse<T>>
) => {
  return async (
    request: Request,
    context: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const requestLogger = logger.child({ requestId });

    try {
      requestLogger.debug(`${request.method} ${request.url}`);
      const response = await handler(request, context);
      response.headers.set('X-Request-ID', requestId);
      return response;
    } catch (error) {
      requestLogger.error(
        'API handler error',
        { method: request.method, url: request.url },
        error instanceof Error ? error : new Error(String(error))
      );
      const response = errors.internal();
      response.headers.set('X-Request-ID', requestId);
      return response;
    }
  };
};
