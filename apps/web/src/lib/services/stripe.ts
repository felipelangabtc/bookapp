import { prisma, SubscriptionPlan, SubscriptionStatus } from '@bookapp/db';
import Stripe from 'stripe';


import { logger } from '../logger';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  : null;

export const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO;

// Create or retrieve Stripe customer for user
export const getOrCreateStripeCustomer = async (
  userId: string,
  email: string
): Promise<string | null> => {
  if (!stripe) {
    logger.warn('Stripe not configured');
    return null;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  // Update or create subscription record with customer ID
  await prisma.subscription.upsert({
    where: { userId },
    update: { stripeCustomerId: customer.id },
    create: {
      userId,
      stripeCustomerId: customer.id,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  return customer.id;
};

// Create Stripe checkout session for Pro subscription
export const createCheckoutSession = async (
  userId: string,
  email: string
): Promise<string | null> => {
  if (!stripe || !STRIPE_PRICE_ID_PRO) {
    logger.warn('Stripe not configured');
    return null;
  }

  const customerId = await getOrCreateStripeCustomer(userId, email);
  if (!customerId) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: STRIPE_PRICE_ID_PRO,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${appUrl}/settings/billing?success=true`,
    cancel_url: `${appUrl}/settings/billing?canceled=true`,
    metadata: { userId },
  });

  return session.url;
};

// Create Stripe billing portal session
export const createBillingPortalSession = async (
  userId: string
): Promise<string | null> => {
  if (!stripe) {
    logger.warn('Stripe not configured');
    return null;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription?.stripeCustomerId) {
    return null;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl}/settings/billing`,
  });

  return session.url;
};

// Handle Stripe webhook events
export const handleStripeWebhook = async (
  event: Stripe.Event
): Promise<void> => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId = session.subscription as string;

      if (userId && subscriptionId) {
        // Get subscription details
        const stripeSubscription = await stripe!.subscriptions.retrieve(subscriptionId);

        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: SubscriptionPlan.PRO,
            status: SubscriptionStatus.ACTIVE,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: stripeSubscription.items.data[0]?.price.id,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          },
        });

        logger.info('User upgraded to Pro', { userId, subscriptionId });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const dbSubscription = await prisma.subscription.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (dbSubscription) {
        let status: SubscriptionStatus;
        switch (subscription.status) {
          case 'active':
            status = SubscriptionStatus.ACTIVE;
            break;
          case 'canceled':
            status = SubscriptionStatus.CANCELED;
            break;
          case 'past_due':
            status = SubscriptionStatus.PAST_DUE;
            break;
          case 'unpaid':
            status = SubscriptionStatus.UNPAID;
            break;
          default:
            status = SubscriptionStatus.ACTIVE;
        }

        await prisma.subscription.update({
          where: { id: dbSubscription.id },
          data: {
            status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });

        logger.info('Subscription updated', {
          userId: dbSubscription.userId,
          status: subscription.status,
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const dbSubscription = await prisma.subscription.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (dbSubscription) {
        await prisma.subscription.update({
          where: { id: dbSubscription.id },
          data: {
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.CANCELED,
            stripeSubscriptionId: null,
            stripePriceId: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
        });

        logger.info('Subscription canceled', { userId: dbSubscription.userId });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const dbSubscription = await prisma.subscription.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (dbSubscription) {
        await prisma.subscription.update({
          where: { id: dbSubscription.id },
          data: { status: SubscriptionStatus.PAST_DUE },
        });

        logger.warn('Payment failed', { userId: dbSubscription.userId });
      }
      break;
    }

    default:
      logger.debug('Unhandled Stripe event', { type: event.type });
  }
};

// Check usage limits
export const checkUsageLimit = async (
  userId: string,
  usageType: string
): Promise<{ allowed: boolean; used: number; limit: number }> => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const plan = subscription?.plan || SubscriptionPlan.FREE;
  const isActive = subscription?.status === SubscriptionStatus.ACTIVE;

  // Get limits based on plan
  const limits: Record<string, Record<SubscriptionPlan, number>> = {
    audiobook_generation: {
      [SubscriptionPlan.FREE]: parseInt(process.env.FREE_AUDIOBOOK_GENERATIONS_PER_MONTH || '5'),
      [SubscriptionPlan.PRO]: parseInt(process.env.PRO_AUDIOBOOK_GENERATIONS_PER_MONTH || '100'),
    },
  };

  const limit = isActive ? (limits[usageType]?.[plan] ?? 0) : 0;

  // Get current period dates
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Count usage in current period
  const usageCount = await prisma.usageRecord.aggregate({
    where: {
      userId,
      type: usageType,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
    },
    _sum: { count: true },
  });

  const used = usageCount._sum.count || 0;

  return {
    allowed: used < limit,
    used,
    limit,
  };
};

// Record usage
export const recordUsage = async (
  userId: string,
  usageType: string
): Promise<void> => {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await prisma.usageRecord.create({
    data: {
      userId,
      type: usageType,
      count: 1,
      periodStart,
      periodEnd,
    },
  });
};
