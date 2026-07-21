/**
 * /api/schedule-rest-push
 * Agenda no QStash a entrega do push de fim de descanso.
 * Corpo: { subscription: PushSubscriptionJSON, delaySeconds: number }
 * Resposta: { messageId } — usado para cancelar se o timer for pausado/ajustado.
 */
// Base do QStash — IMPORTANTE: é específica por REGIÃO. `qstash.upstash.io`
// aponta para eu-central-1; se a conta/token forem de outra região (ex.:
// us-east-1) o publish falha com 404 "user not found in this region". Defina
// QSTASH_URL com o endpoint da sua região (copie do Console do QStash →
// Quickstart, junto com o QSTASH_TOKEN, para garantir que casam).
const DEFAULT_QSTASH_BASE = 'https://qstash.upstash.io';

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
    const qstashBase = (process.env.QSTASH_URL || DEFAULT_QSTASH_BASE).replace(/\/+$/, '');
    const publishUrl = `${qstashBase}/v2/publish/${target}`;

    try {
        const response = await fetch(publishUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Upstash-Delay': `${delay}s`,
                'Upstash-Retries': '2'
            },
            body: JSON.stringify({ subscription, secret: internalSecret })
        });

        const raw = await response.text();
        let data = {};
        try { data = raw ? JSON.parse(raw) : {}; } catch { /* resposta não-JSON */ }

        if (!response.ok || !data.messageId) {
            // Loga o motivo real do QStash (o status aponta a causa: 401 = token
            // inválido, 403 = sem permissão/quota, 404 = URL de destino errada).
            console.error('qstash_publish_failed', {
                qstashStatus: response.status,
                target,
                body: raw.slice(0, 300)
            });
            return res.status(502).json({ error: 'qstash_publish_failed', qstashStatus: response.status });
        }

        return res.status(200).json({ messageId: data.messageId });
    } catch (err) {
        console.error('qstash_unreachable', { message: String(err?.message || err), target });
        return res.status(502).json({ error: 'qstash_unreachable' });
    }
}
