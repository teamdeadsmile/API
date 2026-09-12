import 'dotenv/config';
import { BrevoClient } from '@getbrevo/brevo';

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

async function main() {
  console.log('API key prefix:', process.env.BREVO_API_KEY?.slice(0, 12));
  console.log('Sender:', process.env.BREVO_SENDER_EMAIL);
  console.log('Testing Brevo API directly...');

  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      subject: 'Teste Brevo direto',
      textContent: 'Se você recebeu isso, o Brevo está configurado certo.',
      htmlContent: '<p>Se você recebeu isso, o Brevo está configurado certo.</p>',
      sender: {
        name: process.env.BREVO_SENDER_NAME || 'Deadsmile Games',
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: 'luxjson@gmail.com' }],
    });
    console.log('✅ Enviado. messageId:', result?.messageId);
  } catch (err) {
    console.error('❌ Falhou:');
    console.error('   status:', err.statusCode);
    console.error('   body:', JSON.stringify(err.body || err.response?.body, null, 2));
    console.error('   message:', err.message);
  }
}

main();