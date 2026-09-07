import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiters.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { registerSchema, loginSchema } from '../validators/auth.validators.js';
import { register, login, logout, me } from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validate(registerSchema), register);
authRouter.post('/login',    loginLimiter,    validate(loginSchema),    login);
authRouter.post('/logout',   requireAuth,                               logout);
authRouter.get('/me',        requireAuth,                               me);
