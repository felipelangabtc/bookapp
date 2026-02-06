import { apiSuccess, errors, requireAuth, withApiHandler } from '@/lib/api-utils';
import { createCheckoutSession } from '@/lib/services/stripe';
import { logger } from '@/lib/logger';

export const POST = withApiHandler(async () => {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const checkoutUrl = await createCheckoutSession(
      session!.user.id,
      session!.user.email
    );

    if (!checkoutUrl) {
      return errors.internal('Failed to create checkout session');
    }

    logger.info('Checkout session created', { userId: session!.user.id });

    return apiSuccess({ url: checkoutUrl });
  } catch (error) {
    logger.error('Failed to create checkout session', {}, error instanceof Error ? error : undefined);
    return errors.internal('Failed to create checkout session');
  }
});
