import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as storeService from '../services/store.service.js';

export const storeRouter = Router();

storeRouter.get(
    '/checkout/:slug',
    requireAuth,
    asyncHandler(async (req, res) => {
        const result = await storeService.getCheckoutGame(
            req.params.slug
        );

        sendSuccess(res, result);
    })
);


storeRouter.get(
    '/purchases',
    requireAuth,
    asyncHandler(async (req, res) => {
        const result = await storeService.getPurchaseHistory(
            req.session.userId
        );

        sendSuccess(res, result);
    })
);

storeRouter.get(
    '/library',
    requireAuth,
    asyncHandler(async (req, res) => {
        const result = await storeService.getLibrary(
            req.session.userId
        );

        sendSuccess(res, result);
    })
);