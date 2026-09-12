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

storeRouter.post(
    '/orders',
    requireAuth,
    asyncHandler(async (req, res) => {
        const { slug } = req.body;

        const result = await storeService.createOrder(
            req.session.userId,
            slug
        );

        sendSuccess(res, result, 201);
    })
);

storeRouter.post(
    '/orders/:orderId/payment',
    requireAuth,
    asyncHandler(async (req, res) => {
        const result = await storeService.preparePayment(
            req.session.userId,
            req.params.orderId,
            req.ip
        );

        sendSuccess(res, result);
    })
);