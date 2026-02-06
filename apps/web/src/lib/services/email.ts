import { logger } from '../logger';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailProvider {
  name: string;
  send(options: EmailOptions): Promise<void>;
}

// Mock provider for development
class MockEmailProvider implements EmailProvider {
  name = 'mock';

  async send(options: EmailOptions): Promise<void> {
    logger.info('Mock email sent', {
      to: options.to,
      subject: options.subject,
    });

    // Log email content in development
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📧 Mock Email Sent:');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body: ${options.text}`);
      console.log('---\n');
    }
  }
}

// SMTP provider
class SMTPEmailProvider implements EmailProvider {
  name = 'smtp';

  async send(options: EmailOptions): Promise<void> {
    // In production, use nodemailer or similar
    // This is a placeholder implementation
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      throw new Error('SMTP configuration missing');
    }

    logger.info('SMTP email would be sent', {
      to: options.to,
      subject: options.subject,
      host,
      port,
    });

    // Actual SMTP implementation would go here
    // Using nodemailer or similar library
  }
}

// Resend provider
class ResendEmailProvider implements EmailProvider {
  name = 'resend';

  async send(options: EmailOptions): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Resend API key not configured');
    }

    const fromEmail = process.env.EMAIL_FROM || 'noreply@bookapp.com';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${error}`);
    }

    logger.info('Email sent via Resend', { to: options.to, subject: options.subject });
  }
}

// Get configured email provider
export const getEmailProvider = (): EmailProvider => {
  const providerName = process.env.EMAIL_PROVIDER || 'mock';

  switch (providerName) {
    case 'smtp':
      return new SMTPEmailProvider();
    case 'resend':
      return new ResendEmailProvider();
    case 'mock':
    default:
      return new MockEmailProvider();
  }
};

// Send email
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const provider = getEmailProvider();

  try {
    await provider.send(options);
  } catch (error) {
    logger.error('Failed to send email', { provider: provider.name, to: options.to }, error instanceof Error ? error : undefined);
    throw error;
  }
};

// Email templates
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  const verificationUrl = `${appUrl}/auth/verify?token=${token}`;

  await sendEmail({
    to,
    subject: 'Verify your BookApp email',
    text: `Welcome to BookApp! Please verify your email by clicking this link: ${verificationUrl}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a1a;">Welcome to BookApp!</h1>
            <p>Thanks for signing up. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              If you didn't create an account with BookApp, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
  });
};

export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

  await sendEmail({
    to,
    subject: 'Reset your BookApp password',
    text: `You requested a password reset. Click this link to reset your password: ${resetUrl}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a1a;">Reset Your Password</h1>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
        </body>
      </html>
    `,
  });
};
