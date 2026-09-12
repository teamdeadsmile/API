import { pool } from '../config/database.js';

export async function findPurchasableGameBySlug(slug) {
    const { rows } = await pool.query(
        `SELECT
            id,
            title,
            slug,
            short_description,
            cover_image,
            price_cents,
            currency,
            purchase_url
         FROM games
         WHERE slug = $1
           AND purchase_url IS NOT NULL
         LIMIT 1`,
        [slug]
    );

    return rows[0] || null;
}

export async function findActiveEntitlement(userId, gameId) {
    const { rows } = await pool.query(
        `SELECT
            e.id,
            e.user_id,
            e.game_id,
            e.status,
            e.source,
            e.created_at,
            e.expires_at
         FROM entitlements e
         WHERE e.user_id = $1
           AND e.game_id = $2
           AND e.status = 'active'
           AND (
               e.expires_at IS NULL
               OR e.expires_at > now()
           )
         LIMIT 1`,
        [userId, gameId]
    );

    return rows[0] || null;
}

export async function listUserPurchases(userId) {
    const { rows } = await pool.query(
        `SELECT
            p.id,
            p.game_id,
            p.order_id,
            p.status,
            p.purchased_at,
            p.refunded_at,
            g.title,
            g.slug,
            g.cover_image,
            oi.unit_price_cents,
            oi.currency
         FROM purchases p
         JOIN games g
           ON g.id = p.game_id
         JOIN order_items oi
           ON oi.order_id = p.order_id
          AND oi.game_id = p.game_id
         WHERE p.user_id = $1
         ORDER BY p.purchased_at DESC`,
        [userId]
    );

    return rows;
}

export async function listUserEntitlements(userId) {
    const { rows } = await pool.query(
        `SELECT
            e.id,
            e.game_id,
            e.status,
            e.source,
            e.created_at,
            e.expires_at,
            g.title,
            g.slug,
            g.cover_image,
            g.download_url
         FROM entitlements e
         JOIN games g
           ON g.id = e.game_id
         WHERE e.user_id = $1
           AND e.status = 'active'
           AND (
               e.expires_at IS NULL
               OR e.expires_at > now()
           )
         ORDER BY e.created_at DESC`,
        [userId]
    );

    return rows;
}