import { AppError } from '../utils/AppError.js';
import {
    findPurchasableGameBySlug,
    findActiveEntitlement,
    listUserPurchases,
    listUserEntitlements,
} from '../repositories/store.repository.js';

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