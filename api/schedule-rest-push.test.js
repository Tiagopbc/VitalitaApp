import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from './schedule-rest-push';

function makeRes() {
    const res = {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
    return res;
}

const validSubscription = {
    endpoint: 'https://push.example.com/sub/abc',
    keys: { p256dh: 'chave', auth: 'auth' }
};

describe('/api/schedule-rest-push', () => {
    beforeEach(() => {
        process.env.QSTASH_TOKEN = 'token-teste';
        process.env.VITALITA_BASE_URL = 'https://vitalita.vercel.app';
        process.env.PUSH_INTERNAL_SECRET = 'segredo-teste';
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ messageId: 'msg_123' })
        }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        delete process.env.QSTASH_TOKEN;
        delete process.env.VITALITA_BASE_URL;
        delete process.env.PUSH_INTERNAL_SECRET;
        delete process.env.QSTASH_URL;
    });

    it('rejeita métodos diferentes de POST', async () => {
        const res = makeRes();
        await handler({ method: 'GET' }, res);
        expect(res.statusCode).toBe(405);
    });

    it('responde 503 sem configuração', async () => {
        delete process.env.QSTASH_TOKEN;
        const res = makeRes();
        await handler({ method: 'POST', body: { subscription: validSubscription, delaySeconds: 90 } }, res);
        expect(res.statusCode).toBe(503);
    });

    it('rejeita assinatura inválida', async () => {
        const res = makeRes();
        await handler({ method: 'POST', body: { subscription: { endpoint: 'http://inseguro' }, delaySeconds: 90 } }, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('invalid_subscription');
    });

    it('rejeita delay fora dos limites', async () => {
        const res = makeRes();
        await handler({ method: 'POST', body: { subscription: validSubscription, delaySeconds: 99999 } }, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('invalid_delay');
    });

    it('agenda no QStash com delay, alvo e segredo corretos', async () => {
        const res = makeRes();
        await handler({ method: 'POST', body: { subscription: validSubscription, delaySeconds: 92 } }, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.messageId).toBe('msg_123');

        const [url, options] = fetch.mock.calls[0];
        expect(url).toBe('https://qstash.upstash.io/v2/publish/https://vitalita.vercel.app/api/send-rest-push');
        expect(options.headers['Upstash-Delay']).toBe('92s');
        expect(JSON.parse(options.body)).toEqual({ subscription: validSubscription, secret: 'segredo-teste' });
    });

    it('usa o endpoint da região quando QSTASH_URL está definido', async () => {
        process.env.QSTASH_URL = 'https://qstash-us-east-1.upstash.io';
        const res = makeRes();
        await handler({ method: 'POST', body: { subscription: validSubscription, delaySeconds: 90 } }, res);

        expect(res.statusCode).toBe(200);
        const [url] = fetch.mock.calls[0];
        expect(url).toBe('https://qstash-us-east-1.upstash.io/v2/publish/https://vitalita.vercel.app/api/send-rest-push');
    });

    it('responde 502 quando o QStash falha (e expõe o status do QStash)', async () => {
        fetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => JSON.stringify({ error: 'unauthorized' }) });
        const res = makeRes();
        await handler({ method: 'POST', body: { subscription: validSubscription, delaySeconds: 90 } }, res);
        expect(res.statusCode).toBe(502);
        expect(res.body.error).toBe('qstash_publish_failed');
        expect(res.body.qstashStatus).toBe(401);
    });
});
