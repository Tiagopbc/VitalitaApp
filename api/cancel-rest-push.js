/**
 * /api/cancel-rest-push
 * Cancela uma entrega agendada no QStash (timer pausado, ajustado ou
 * concluído em primeiro plano). Corpo: { messageId }.
 */
const QSTASH_MESSAGES_URL = 'https://qstash.upstash.io/v2/messages/';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'method_not_allowed' });
    }

    const token = process.env.QSTASH_TOKEN;
    if (!token) {
        return res.status(503).json({ error: 'push_not_configured' });
    }

    const { messageId } = req.body ?? {};
    if (typeof messageId !== 'string' || !/^[\w-]{1,128}$/.test(messageId)) {
        return res.status(400).json({ error: 'invalid_message_id' });
    }

    try {
        const response = await fetch(QSTASH_MESSAGES_URL + encodeURIComponent(messageId), {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        // 404 = já entregue ou já cancelada — nada a fazer.
        if (!response.ok && response.status !== 404) {
            return res.status(502).json({ error: 'qstash_cancel_failed' });
        }

        return res.status(200).json({ ok: true });
    } catch {
        return res.status(502).json({ error: 'qstash_unreachable' });
    }
}
