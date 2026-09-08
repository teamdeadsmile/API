import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import * as controller from '../controllers/wishlist.controller.js';

const addSchema = z.object({
  gameId: z.coerce.number().int().positive(),
});

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);

wishlistRouter.post('/', validate(addSchema), controller.add);
wishlistRouter.delete('/:gameId', controller.remove);
wishlistRouter.get('/', controller.list);