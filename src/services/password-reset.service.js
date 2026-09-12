import crypto from 'node:crypto';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';
import { query } from '../config/database.js';
import { findUserByEmail } from '../repositories/users.repository.js';
import {
  createResetToken,
  findValidByHash,
  markUsed,
} from '../repositories/password-resets.repository.js';
import { sendPasswordResetEmail } from './email.service.js';
import { env } from '../config/env.js';

const TOKEN_TTL_MS = 60 * 60 * 1000;

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
export async function requestPasswordReset(email) {
  const user = await findUserByEmail(email);
  if (!user) {
    await new Promise((r) => setTimeout(r, 250));
    return { sent: true };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await createResetToken({ userId: user.id, tokenHash, expiresAt });
  const resetUrl = `${env.frontendUrl}/reset-password?token=${rawToken}`;
console.log('[password-reset] → enviando para:', user.email);

sendPasswordResetEmail({
  to: user.email,
  username: user.username,
  resetUrl,
}).then((result) => {
  console.log('[password-reset] ✓ resultado:', result);
}).catch((err) => {
  console.error('[password-reset] ✗ FALHOU:');
  console.error('  status:', err.statusCode);
  console.error('  body:', JSON.stringify(err.body || err.response?.body, null, 2));
  console.error('  message:', err.message);
});
  return { sent: true };
}

export async function resetPassword({ token, password }) {
  if (!token || typeof token !== 'string') {
    throw new AppError(400, 'INVALID_TOKEN', 'Invalid or expired reset link.');
  }

  const tokenHash = sha256(token);
  const record = await findValidByHash(tokenHash);

  if (!record) {
    throw new AppError(400, 'INVALID_TOKEN', 'Invalid or expired reset link.');
  }

  const newHash = await hashPassword(password);

  await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [newHash, record.user_id],
  );

  await markUsed(record.id);
  try {
    await query(
      `DELETE FROM user_sessions WHERE sess->>'userId' = $1`,
      [record.user_id],
    );
  } catch {
  }

  return { reset: true };
}