import {
    findPurchasableGameBySlug,
    findActiveEntitlement,
    findPendingOrderByGame,
    listUserPurchases,
    listUserEntitlements,
    createPendingOrder,
} from '../repositories/store.repository.js';
import { AppError } from '../utils/AppError.js';

export async function getCheckoutGame(slug) {
    const game = await findPurchasableGameBySlug(slug);

    if (!game) {
        throw new AppError(
            404,
            'GAME_NOT_FOR_SALE',
            'That game is not available for purchase.'
        );
    }

    return {
        id: game.id,
        title: game.title,
        slug: game.slug,
        shortDescription: game.short_description,
        coverImage: game.cover_image,
        priceCents: game.price_cents,
        currency: game.currency,
        purchaseUrl: game.purchase_url,
    };
}

export async function hasGameEntitlement(userId, gameId) {
    const entitlement = await findActiveEntitlement(userId, gameId);

    return Boolean(entitlement);
}

export async function getPurchaseHistory(userId) {
    return listUserPurchases(userId);
}

export async function getLibrary(userId) {
    return listUserEntitlements(userId);
}

export async function createOrder(userId, slug) {
    const game = await findPurchasableGameBySlug(slug);

    if (!game) {
        throw new AppError(
            404,
            'GAME_NOT_FOR_SALE',
            'That game is not available for purchase.'
        );
    }

    const existingEntitlement = await findActiveEntitlement(
        userId,
        game.id
    );

    if (existingEntitlement) {
        throw new AppError(
            409,
            'GAME_ALREADY_OWNED',
            'You already own this game.'
        );
    }

    const existingOrder = await findPendingOrderByGame(
        userId,
        game.id
    );

    if (existingOrder) {
        return {
            id: existingOrder.id,
            status: existingOrder.status,
            currency: existingOrder.currency,
            subtotalCents: existingOrder.subtotal_cents,
            totalCents: existingOrder.total_cents,
            createdAt: existingOrder.created_at,
            game: {
                id: game.id,
                title: game.title,
                slug: game.slug,
                priceCents: game.price_cents,
                currency: game.currency,
            },
        };
    }

    const order = await createPendingOrder({
        userId,
        gameId: game.id,
        title: game.title,
        priceCents: game.price_cents,
        currency: game.currency,
    });

    return {
        id: order.id,
        status: order.status,
        currency: order.currency,
        subtotalCents: order.subtotal_cents,
        totalCents: order.total_cents,
        createdAt: order.created_at,
        game: {
            id: game.id,
            title: game.title,
            slug: game.slug,
            priceCents: game.price_cents,
            currency: game.currency,
        },
    };
}