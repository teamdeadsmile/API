import { query } from '../config/database.js';

export async function createTicket({ email, category, message }) {
  const { rows } = await query(
    `INSERT INTO support_tickets (email, category, message)
     VALUES ($1, $2, $3)
     RETURNING id, status, created_at`,
    [email.toLowerCase(), category, message]
  );
  return rows[0];
}
