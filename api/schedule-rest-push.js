/**
 * /api/schedule-rest-push
 * Agenda no QStash a entrega do push de fim de descanso.
 * Corpo: { subscription: PushSubscriptionJSON, delaySeconds: number }
 * Resposta: { messageId } — usado para cancelar se o timer for pausado/ajustado.
 */
const QSTASH_PUBLISH_URL = 'https://qstash.upstash.io/v2/publish/';

const MIN_DELAY_SECONDS = 5;
const MAX_DELAY_SECONDS = 3600;

function isValidSubscription(subscription) {
    return Boolean(
        subscription
        && typeof subscription.endpoint === 'string'
        && subscription.endpoint.startsWith('https://')
        && subscription.keys
        && typeof subscription.keys.p256dh === 'string'
        && typeof subscription.keys.auth === 'string'
    );
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'method_not_allowed' });
    }

    const token = process.env.QSTASH_TOKEN;
    const baseUrl = process.env.VITALITA_BASE_URL;
    const internalSecret = process.env.PUSH_INTERNAL_SECRET;
    if (!token || !baseUrl || !internalSecret) {
        return res.status(503).json({ error: 'push_not_configured' });
    }

    const { subscription, delaySeconds } = req.body ?? {};
    const delay = Math.round(Number(delaySeconds));

    if (!isValidSubscription(subscription)) {
        return res.status(400).json({ error: 'invalid_subscription' });
    }
    if (!Number.isFinite(delay) || delay < MIN_DELAY_SECONDS || delay > MAX_DELAY_SECONDS) {
        return res.status(400).json({ error: 'invalid_delay' });
    }

    const target = `${baseUrl.replace(/\/+$/, '')}/api/send-rest-push`;

    try {
        const response = await fetch(QSTASH_PUBLISH_URL + target, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Upstash-Delay': `${delay}s`,
                'Upstash-Retries': '2'
            },
            body: JSON.stringify({ subscription, secret: internalSecret })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.messageId) {
            return res.status(502).json({ error: 'qstash_publish_failed' });
        }

        return res.status(200).json({ messageId: data.messageId });
    } catch {
        return res.status(502).json({ error: 'qstash_unreachable' });
    }
}
