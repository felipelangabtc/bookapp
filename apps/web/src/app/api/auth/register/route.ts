import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { prisma, SubscriptionPlan, SubscriptionStatus } from '@bookapp/db';

import { hashPassword } from '@/lib/auth';
import {
  validateBody,
  apiSuccess,
  apiError,
  errors,
  withApiHandler,
} from '@/lib/api-utils';
import { registerSchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/services/email';
import { logger } from '@/lib/logger';

export const POST = withApiHandler(async (request: Request) => {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rateLimit = await checkRateLimit(ip, 'register');
  if (!rateLimit.success) {
    return errors.rateLimited(Math.ceil((rateLimit.reset - Date.now()) / 1000));
  }

  // Validate request body
  const { data, error } = await validateBody(request, registerSchema.omit({ confirmPassword: true }));
  if (error) return error;

  const { email, username, password } = data;

  try {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return apiError('EMAIL_TAKEN', 'Email is already registered', 400);
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      return apiError('USERNAME_TAKEN', 'Username is already taken', 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        displayName: username,
      },
    });

    // Create default subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    // Create verification token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'email',
        expiresAt,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, token);
    } catch (emailError) {
      logger.error('Failed to send verification email', { userId: user.id }, emailError instanceof Error ? emailError : undefined);
      // Don't fail registration if email fails - user can request new verification
    }

    // Log registration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entityType: 'USER',
        entityId: user.id,
        metadata: { email: email.toLowerCase() },
      },
    });

    logger.info('User registered', { userId: user.id, username });

    return apiSuccess(
      {
        message: 'Registration successful. Please check your email to verify your account.',
        userId: user.id,
      },
      undefined,
      201
    );
  } catch (error) {
    logger.error('Registration error', {}, error instanceof Error ? error : undefined);
    return errors.internal('Failed to create account');
  }
});
