import { AppError } from '../utils/AppError.js';

const XSOLLA_API_URL = 'https://store.xsolla.com/api/v3';

function getXsollaConfig() {
    const projectId = process.env.XSOLLA_PROJECT_ID;
    const apiKey = process.env.XSOLLA_API_KEY;
    const mode = process.env.XSOLLA_MODE || 'sandbox';

    if (!projectId) {
        throw new AppError(
            500,
            'XSOLLA_CONFIG_ERROR',
            'Xsolla Project ID is not configured.'
        );
    }

    if (!apiKey) {
        throw new AppError(
            500,
            'XSOLLA_CONFIG_ERROR',
            'Xsolla API key is not configured.'
        );
    }

    return {
        projectId,
        apiKey,
        sandbox: mode !== 'production',
    };
}

export async function createXsollaPaymentToken({
    userId,
    email,
    ipAddress,
    orderId,
    sku,
    returnUrl,
    currency,
}) {
    const config = getXsollaConfig();

    const credentials = Buffer.from(
        `${config.projectId}:${config.apiKey}`
    ).toString('base64');

    const body = {
        sandbox: config.sandbox,

        user: {
            id: {
                value: String(userId),
            },
            email: {
                value: email,
            },
            country: {
                value: 'BR',
                allow_modify: false,
            },
        },

        purchase: {
            items: [
                {
                    sku,
                    quantity: 1,
                },
            ],
        },

        settings: {
            external_id: String(orderId),
            currency,
            ...(returnUrl
                ? {
                    return_url: returnUrl,
                }
                : {}),
        },

        custom_parameters: {
            deadsmile_order_id: String(orderId),
        },
    };

    const headers = {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
    };

    if (ipAddress) {
        headers['X-User-Ip'] = ipAddress;
    }

    const response = await fetch(
        `${XSOLLA_API_URL}/project/${encodeURIComponent(
            config.projectId
        )}/admin/payment/token`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        }
    );

    const responseText = await response.text();

    let data;

    try {
        data = responseText
            ? JSON.parse(responseText)
            : null;
    } catch {
        data = null;
    }

    if (!response.ok) {
        console.error(
            'Xsolla payment token error:',
            response.status,
            data || responseText
        );

        throw new AppError(
            502,
            'XSOLLA_PAYMENT_ERROR',
            'Unable to initialize the payment.'
        );
    }

    if (!data?.token) {
        console.error(
            'Xsolla returned an invalid payment response:',
            data
        );

        throw new AppError(
            502,
            'XSOLLA_INVALID_RESPONSE',
            'Xsolla returned an invalid payment response.'
        );
    }

    const checkoutBaseUrl = config.sandbox
        ? 'https://sandbox-secure.xsolla.com/paystation4/'
        : 'https://secure.xsolla.com/paystation4/';

    return {
        token: data.token,
        checkoutUrl:
            `${checkoutBaseUrl}?token=` +
            encodeURIComponent(data.token),
    };
}