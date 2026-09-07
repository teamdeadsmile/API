import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const nodeEnv       = process.env.NODE_ENV || 'development';
const isProduction  = nodeEnv === 'production';
const cookieSameSite = process.env.COOKIE_SAMESITE || (isProduction ? 'none' : 'lax');

if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
  throw new Error('COOKIE_SAMESITE must be one of: lax, strict, none');
}

const sessionSecret = required('SESSION_SECRET');
if (sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters long.');
}

export const env = {
  nodeEnv,
  isProduction,
  port:           Number(process.env.PORT) || 5000,
  databaseUrl:    required('DATABASE_URL'),
  frontendUrl:    process.env.FRONTEND_URL || 'http://localhost:5173',
  sessionSecret,
  cookieSameSite,
};
