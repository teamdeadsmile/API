import { BrevoClient } from '@getbrevo/brevo';
import { env } from '../config/env.js';
const brevo = env.brevoApiKey
  ? new BrevoClient({ apiKey: env.brevoApiKey })
  : null;
export async function sendTransactionalEmail({ to, subject, text, html }) {
  if (!brevo) {
    console.warn('BREVO_API_KEY not set. Email skipped.');
    return { skipped: true };
  }

  if (!env.brevoSenderEmail) {
    console.warn('BREVO_SENDER_EMAIL not set. Email skipped.');
    return { skipped: true };
  }

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject,
      textContent: text,
      htmlContent: html,
      sender: {
        name: env.brevoSenderName,
        email: env.brevoSenderEmail,
      },
      to: [{ email: to }],
    });

    return { sent: true, messageId: result?.messageId };
  } catch (err) {
    console.error(
      `Brevo send failed [${err.statusCode || 'unknown'}]:`,
      err.message,
    );
    throw err;
  }
}