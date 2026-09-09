import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import * as repo from '../repositories/totp.repository.js';
import { AppError } from '../utils/AppError.js';

export async function generateTotpSetup(userId, email) {
  const secret = speakeasy.generateSecret({
    name: `DEADSMILE:${email}`,
    length: 20,
  });
  await repo.upsertTotpSecret(userId, secret.base32);
  const otpauthUrl = secret.otpauth_url;
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { secret: secret.base32, qrCodeDataUrl };
}

export async function verifyAndEnableTotp(userId, token) {
  const totp = await repo.findTotpByUserId(userId);
  if (!totp) throw new AppError(404, 'TOTP_NOT_SETUP', '2FA not set up.');
  const verified = speakeasy.totp.verify({
    secret: totp.secret,
    encoding: 'base32',
    token,
    window: 1,
  });
  if (!verified) throw new AppError(400, 'INVALID_TOTP', 'Invalid 2FA code.');
  await repo.enableTotp(userId);
  return { enabled: true };
}

export async function disableTotp(userId, token) {
  const totp = await repo.findTotpByUserId(userId);
  if (!totp) throw new AppError(404, 'TOTP_NOT_SETUP', '2FA not set up.');
  if (totp.enabled) {
    const verified = speakeasy.totp.verify({
      secret: totp.secret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified) throw new AppError(400, 'INVALID_TOTP', 'Invalid 2FA code.');
  }
  await repo.disableTotp(userId);
  return { disabled: true };
}

export async function verifyTotpLogin(userId, token) {
  const totp = await repo.findTotpByUserId(userId);
  if (!totp || !totp.enabled) return false;
  const verified = speakeasy.totp.verify({
    secret: totp.secret,
    encoding: 'base32',
    token,
    window: 1,
  });
  return verified;
}