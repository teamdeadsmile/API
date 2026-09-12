import { BrevoClient } from '@getbrevo/brevo';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const brevo = env.brevoApiKey
  ? new BrevoClient({
      apiKey: env.brevoApiKey,
      timeoutInSeconds: 15,
      maxRetries: 2,
    })
  : null;

export async function sendTransactionalEmail({
  to,
  subject,
  text,
  html,
}) {
  if (!brevo) {
    console.error(
      '[brevo] BREVO_API_KEY is not configured.'
    );

    throw new AppError(
      500,
      'EMAIL_NOT_CONFIGURED',
      'Email service is temporarily unavailable.',
    );
  }

  if (!env.brevoSenderEmail) {
    console.error(
      '[brevo] BREVO_SENDER_EMAIL is not configured.'
    );

    throw new AppError(
      500,
      'EMAIL_NOT_CONFIGURED',
      'Email service is temporarily unavailable.',
    );
  }

  if (!to) {
    throw new AppError(
      500,
      'EMAIL_INVALID_RECIPIENT',
      'Email recipient is invalid.',
    );
  }

  try {
    const result =
      await brevo.transactionalEmails.sendTransacEmail({
        subject,
        textContent: text,
        htmlContent: html,
        sender: {
          name: env.brevoSenderName,
          email: env.brevoSenderEmail,
        },
        to: [
          {
            email: to,
          },
        ],
      });

    console.info(
      '[brevo] transactional email accepted:',
      {
        messageId: result?.messageId,
      },
    );

    return {
      sent: true,
      messageId: result?.messageId ?? null,
    };
  } catch (error) {
    console.error('[brevo] transactional email failed:', {
      status: error?.statusCode,
      message: error?.message,
      body: error?.body,
    });

    throw new AppError(
      502,
      'EMAIL_SEND_FAILED',
      'Unable to send the email right now. Please try again later.',
    );
  }
}