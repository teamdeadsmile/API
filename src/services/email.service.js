import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.resendApiKey);

export async function sendTicketNotification(ticket) {
  const { id, email: userEmail, category, message, created_at } = ticket;

  if (!env.resendApiKey) {
    console.warn('RESEND_API_KEY not set. Email notification skipped.');
    return;
  }

  if (!env.notifyEmail) {
    console.warn('NOTIFY_EMAIL not set. Email notification skipped.');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'DEADSMILE Support <onboarding@resend.dev>',
      to: env.notifyEmail,
      replyTo: userEmail,
      subject: `[Support Ticket #${id}] ${category}`,
      text: `
New support ticket:

ID: ${id}
User: ${userEmail}
Category: ${category}
Date: ${new Date(created_at).toLocaleString()}

Message:
${message}

To reply, simply reply to this email – it will go directly to the user.
      `,
      html: `
<h2>New support ticket</h2>
<p><strong>ID:</strong> ${id}</p>
<p><strong>User:</strong> ${userEmail}</p>
<p><strong>Category:</strong> ${category}</p>
<p><strong>Date:</strong> ${new Date(created_at).toLocaleString()}</p>
<h3>Message:</h3>
<p>${message.replace(/\n/g, '<br>')}</p>
<p><em>To reply, simply reply to this email – it will go directly to the user.</em></p>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
    }
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
}
