import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { loginLimiter, registerLimiter, twoFactorLimiter } from '../middleware/rateLimiters.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { totpTokenSchema } from '../validators/totp.validators.js';
import {
  registerSchema,
  loginSchema,
  mobileLoginSchema,
  mobileRegisterSchema,
} from '../validators/auth.validators.js';

import {
  register,
  login,
  mobileLogin,
  logout,
  me,
  mobileRegister,
  verifyTwoFactor,
} from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validate(registerSchema), register);
authRouter.post('/login', loginLimiter, validate(loginSchema), login);
authRouter.post('/logout', requireAuth, logout);
authRouter.get('/me', requireAuth, me);
authRouter.post('/verify-2fa', twoFactorLimiter, validate(totpTokenSchema), verifyTwoFactor);
authRouter.post(
  '/mobile-login',
  loginLimiter,
  validate(mobileLoginSchema),
  mobileLogin
);
authRouter.post(
  '/mobile-register',
  registerLimiter,
  validate(mobileRegisterSchema),
  mobileRegister
);