import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { updateAccountSchema, deleteAccountSchema } from '../validators/account.validators.js';
import { show, update, remove, publicProfile } from '../controllers/account.controller.js';

export const accountRouter = Router();

accountRouter.get('/profile/:username', publicProfile);
accountRouter.get('/',                  requireAuth,                           show);
accountRouter.patch('/',                requireAuth, validate(updateAccountSchema), update);
accountRouter.delete('/',               requireAuth, validate(deleteAccountSchema), remove);
