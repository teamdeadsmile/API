import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const RECAPTCHA_VERIFY_URL =
  'https://www.google.com/recaptcha/api/siteverify';

export async function verifyRecaptcha(
  token,
  remoteIp = undefined
) {
  if (!env.recaptchaSecretKey) {
    throw new AppError(
      500,
      'RECAPTCHA_NOT_CONFIGURED',
      'reCAPTCHA is not configured on the server.'
    );
  }

  if (
    typeof token !== 'string' ||
    token.trim().length === 0
  ) {
    throw new AppError(
      400,
      'RECAPTCHA_REQUIRED',
      'Please complete the reCAPTCHA verification.'
    );
  }

  const body = new URLSearchParams({
    secret: env.recaptchaSecretKey,
    response: token,
  });

  if (remoteIp) {
    body.set('remoteip', remoteIp);
  }

  let response;

  try {
    response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded',
      },
      body,
    });
  } catch (error) {
    throw new AppError(
      502,
      'RECAPTCHA_UNAVAILABLE',
      'Unable to verify reCAPTCHA right now.'
    );
  }

  if (!response.ok) {
    throw new AppError(
      502,
      'RECAPTCHA_UNAVAILABLE',
      'Unable to verify reCAPTCHA right now.'
    );
  }

  let result;

  try {
    result = await response.json();
  } catch (error) {
    throw new AppError(
      502,
      'RECAPTCHA_INVALID_RESPONSE',
      'Invalid response received from reCAPTCHA.'
    );
  }

  if (!result.success) {
    throw new AppError(
      400,
      'RECAPTCHA_FAILED',
      'Please complete the reCAPTCHA verification.'
    );
  }

  return true;
}
