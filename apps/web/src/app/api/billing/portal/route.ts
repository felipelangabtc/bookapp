import { apiSuccess, errors, requireAuth, withApiHandler } from '@/lib/api-utils';
import { createBillingPortalSession } from '@/lib/services/stripe';
import { logger } from '@/lib/logger';

export const POST = withApiHandler(async () => {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const portalUrl = await createBillingPortalSession(session!.user.id);

    if (!portalUrl) {
      return errors.badRequest('No subscription found');
    }

    logger.info('Billing portal session created', { userId: session!.user.id });

    return apiSuccess({ url: portalUrl });
  } catch (error) {
    logger.error('Failed to create billing portal session', {}, error instanceof Error ? error : undefined);
    return errors.internal('Failed to create billing portal session');
  }
});
