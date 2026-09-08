import { Resend } from "resend";
import { env } from "../config/env.js";
const resend = new Resend(env.resendApiKey);
export async function sendTicketNotification(ticket) {
  const { id, email: userEmail, category, message, created_at } = ticket;
  if (!env.resendApiKey) {
    console.warn("RESEND_API_KEY não configurada. E-mail não enviado.");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "DEADSMILE Support <onboarding@resend.dev>",
      to: env.notifyEmail,
      subject: `[Support Ticket #${id}] ${category}`,
      text: `
Novo ticket de suporte:

ID: ${id}
Usuário: ${userEmail}
Categoria: ${category}
Data: ${new Date(created_at).toLocaleString()}

Mensagem:
${message}

Para responder, basta responder a este e-mail – ele irá para o usuário.
      `,
      html: `
<h2>Novo ticket de suporte</h2>
<p><strong>ID:</strong> ${id}</p>
<p><strong>Usuário:</strong> ${userEmail}</p>
<p><strong>Categoria:</strong> ${category}</p>
<p><strong>Data:</strong> ${new Date(created_at).toLocaleString()}</p>
<h3>Mensagem:</h3>
<p>${message.replace(/\n/g, "<br>")}</p>
<p><em>Para responder, basta responder a este e-mail – ele irá para o usuário.</em></p>
      `,
    });

    if (error) {
      console.error("Erro ao enviar e-mail:", error);
    } else {
      console.log("E-mail enviado com sucesso:", data);
    }
  } catch (err) {
    console.error("Falha no envio de e-mail:", err.message);
  }
}
