import { z } from 'zod';

import {
  apiSuccess,
  errors,
  requireAuth,
  validateBody,
  withApiHandler,
} from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { translateText } from '@/lib/services/translation';

const translateSchema = z.object({
  text: z.string().min(1).max(10000),
  targetLanguage: z.string().min(2).max(10),
  sourceLanguage: z.string().min(2).max(10).optional(),
});

export const POST = withApiHandler(async (request: Request) => {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  // Rate limiting
  const rateLimit = await checkRateLimit(session!.user.id, 'translation');
  if (!rateLimit.success) {
    return errors.rateLimited();
  }

  const { data, error } = await validateBody(request, translateSchema);
  if (error) return error;

  try {
    const result = await translateText(
      data.text,
      data.targetLanguage,
      data.sourceLanguage
    );

    logger.info('Translation completed', {
      userId: session!.user.id,
      targetLanguage: data.targetLanguage,
      textLength: data.text.length,
    });

    return apiSuccess(result);
  } catch (error) {
    logger.error('Translation failed', {}, error instanceof Error ? error : undefined);
    return errors.internal('Translation failed');
  }
});
