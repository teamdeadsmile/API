import { pool } from '../config/database.js';

export async function findPurchasableGameBySlug(slug) {
    const { rows } = await pool.query(
        `
        SELECT
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
          AND price_cents IS NOT NULL
          AND price_cents >= 0
          AND currency IS NOT NULL
        LIMIT 1
        `,
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

export async function createPendingOrder({
    userId,
    gameId,
    title,
    priceCents,
    currency,
}) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            `
            INSERT INTO orders (
                user_id,
                status,
                currency,
                subtotal_cents,
                total_cents
            )
            VALUES ($1, 'pending', $2, $3, $3)
            RETURNING
                id,
                user_id,
                status,
                currency,
                subtotal_cents,
                total_cents,
                created_at
            `,
            [userId, currency, priceCents]
        );

        const order = orderResult.rows[0];

        await client.query(
            `
            INSERT INTO order_items (
                order_id,
                game_id,
                title,
                unit_price_cents,
                currency
            )
            VALUES ($1, $2, $3, $4, $5)
            `,
            [
                order.id,
                gameId,
                title,
                priceCents,
                currency,
            ]
        );

        await client.query('COMMIT');

        return order;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function findPendingOrderByGame(userId, gameId) {
    const { rows } = await pool.query(
        `
        SELECT
            o.id,
            o.user_id,
            o.status,
            o.currency,
            o.subtotal_cents,
            o.total_cents,
            o.created_at
        FROM orders o
        JOIN order_items oi
          ON oi.order_id = o.id
        WHERE o.user_id = $1
          AND oi.game_id = $2
          AND o.status = 'pending'
        ORDER BY o.created_at DESC
        LIMIT 1
        `,
        [userId, gameId]
    );

    return rows[0] || null;
}

// FIX: a assinatura recebe (orderId, userId) para alinhar com a query,
// que filtra WHERE o.id = $1 AND o.user_id = $2.
// O bug anterior era a assinatura (userId, orderId) com params [orderId, userId],
// fazendo $1 = userId e $2 = orderId — ao contrário do esperado pela query.
export async function findPendingOrderForPayment(orderId, userId) {
    const { rows } = await pool.query(
        `
        SELECT
            o.id,
            o.user_id,
            o.status,
            o.currency,
            o.subtotal_cents,
            o.total_cents,

            oi.game_id,
            oi.title,
            oi.unit_price_cents,
            oi.currency AS item_currency,

            g.slug,
            g.purchase_url,
            g.price_cents,
            g.currency AS game_currency,

            u.email AS user_email
        FROM orders o

        JOIN order_items oi
          ON oi.order_id = o.id

        JOIN games g
          ON g.id = oi.game_id

        JOIN users u
          ON u.id = o.user_id

        WHERE o.id = $1
          AND o.user_id = $2
          AND o.status = 'pending'

        LIMIT 1
        `,
        [orderId, userId]
    );

    return rows[0] || null;
}
