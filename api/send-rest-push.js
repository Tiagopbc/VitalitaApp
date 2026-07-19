/**
 * /api/send-rest-push
 * Chamado pelo QStash na hora agendada; envia o Web Push da notificação
 * de descanso concluído. Autenticado pelo segredo interno incluído no corpo
 * ao agendar (somente /api/schedule-rest-push o conhece).
 */
import crypto from 'node:crypto';
import webpush from 'web-push';

function secretMatches(provided, expected) {
    if (typeof provided !== 'string' || typeof expected !== 'string') return false;
    const providedBuffer = Buffer.from(provided);
    const expectedBuffer = Buffer.from(expected);
    if (providedBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'method_not_allowed' });
    }

    const {
        VAPID_PUBLIC_KEY: publicKey,
        VAPID_PRIVATE_KEY: privateKey,
        VAPID_SUBJECT: subject,
        PUSH_INTERNAL_SECRET: internalSecret
    } = process.env;

    if (!publicKey || !privateKey || !internalSecret) {
        return res.status(503).json({ error: 'push_not_configured' });
    }

    const { subscription, secret } = req.body ?? {};
    if (!secretMatches(secret, internalSecret)) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    if (!subscription?.endpoint) {
        return res.status(400).json({ error: 'invalid_subscription' });
    }

    webpush.setVapidDetails(subject || 'mailto:contato@vitalita.app', publicKey, privateKey);

    const payload = JSON.stringify({
        title: 'Vitalità',
        body: 'Descanso concluído. Hora da próxima série! 💪',
        url: '/'
    });

    try {
        await webpush.sendNotification(subscription, payload, { TTL: 120, urgency: 'high' });
        return res.status(200).json({ ok: true });
    } catch (err) {
        // 404/410: assinatura expirou/foi revogada — sucesso do ponto de vista
        // do QStash (não adianta reentregar).
        if (err?.statusCode === 404 || err?.statusCode === 410) {
            return res.status(200).json({ ok: false, expired: true });
        }
        return res.status(502).json({ error: 'push_send_failed' });
    }
}
