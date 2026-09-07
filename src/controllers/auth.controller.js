import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { registerUser, authenticateUser } from '../services/auth.service.js';
import { getAccount } from '../services/account.service.js';
import { env } from '../config/env.js';

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
}

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  await regenerateSession(req);
  req.session.userId = user.id;
  req.session.role   = user.role;
  sendSuccess(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req.body);
  await regenerateSession(req);
  req.session.userId = user.id;
  req.session.role   = user.role;
  sendSuccess(res, user);
});

export const logout = asyncHandler(async (req, res) => {
  await destroySession(req);
  res.clearCookie('deadsmile.sid', {
    httpOnly: true,
    secure:   env.isProduction,
    sameSite: env.cookieSameSite,
    path:     '/',
  });
  sendSuccess(res, { loggedOut: true });
});

export const me = asyncHandler(async (req, res) => {
  const user = await getAccount(req.session.userId);
  sendSuccess(res, user);
});
