import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('web-push', () => ({
    default: {
        setVapidDetails: vi.fn(),
        sendNotification: vi.fn()
    }
}));

import handler from './send-rest-push';
import webpush from 'web-push';

const SEGREDO = 'segredo-interno-teste';
const assinatura = { endpoint: 'https://push.example.com/abc', keys: { p256dh: 'p', auth: 'a' } };

function makeRes() {
    return {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; }
    };
}

function req(body, metodo = 'POST') {
    return { method: metodo, body };
}

describe('/api/send-rest-push', () => {
    beforeEach(() => {
        process.env.VAPID_PUBLIC_KEY = 'publica';
        process.env.VAPID_PRIVATE_KEY = 'privada';
        process.env.PUSH_INTERNAL_SECRET = SEGREDO;
        webpush.sendNotification.mockResolvedValue({ statusCode: 201 });
    });

    afterEach(() => {
        vi.clearAllMocks();
        delete process.env.VAPID_PUBLIC_KEY;
        delete process.env.VAPID_PRIVATE_KEY;
        delete process.env.VAPID_SUBJECT;
        delete process.env.PUSH_INTERNAL_SECRET;
    });

    it('rejeita métodos diferentes de POST', async () => {
        const res = makeRes();
        await handler(req({ subscription: assinatura, secret: SEGREDO }, 'GET'), res);
        expect(res.statusCode).toBe(405);
    });

    it('responde 503 sem as variáveis de push configuradas', async () => {
        delete process.env.VAPID_PRIVATE_KEY;
        const res = makeRes();

        await handler(req({ subscription: assinatura, secret: SEGREDO }), res);

        expect(res.statusCode).toBe(503);
        expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    // Só o QStash, com o segredo que o schedule-rest-push embutiu no corpo,
    // pode disparar a notificação.
    it.each([
        ['sem segredo', undefined],
        ['segredo errado do mesmo tamanho', 'segredo-interno-xxxxx'],
        ['segredo de tamanho diferente', 'curto'],
        ['segredo que não é texto', 12345]
    ])('recusa chamada %s', async (_caso, secret) => {
        const res = makeRes();

        await handler(req({ subscription: assinatura, secret }), res);

        expect(res.statusCode).toBe(401);
        expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('recusa corpo vazio como não autorizado', async () => {
        const res = makeRes();
        await handler({ method: 'POST' }, res);
        expect(res.statusCode).toBe(401);
    });

    it('recusa assinatura sem endpoint', async () => {
        const res = makeRes();

        await handler(req({ subscription: { keys: {} }, secret: SEGREDO }), res);

        expect(res.statusCode).toBe(400);
        expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('envia a notificação com TTL curto e urgência alta', async () => {
        const res = makeRes();

        await handler(req({ subscription: assinatura, secret: SEGREDO }), res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ ok: true });
        expect(webpush.setVapidDetails).toHaveBeenCalledWith('mailto:contato@vitalita.app', 'publica', 'privada');
        const [destino, payload, opcoes] = webpush.sendNotification.mock.calls[0];
        expect(destino).toBe(assinatura);
        expect(JSON.parse(payload)).toMatchObject({ title: 'Vitalità', url: '/' });
        expect(opcoes).toEqual({ TTL: 120, urgency: 'high' });
    });

    it('usa o VAPID_SUBJECT quando configurado', async () => {
        process.env.VAPID_SUBJECT = 'mailto:outro@example.com';
        const res = makeRes();

        await handler(req({ subscription: assinatura, secret: SEGREDO }), res);

        expect(webpush.setVapidDetails).toHaveBeenCalledWith('mailto:outro@example.com', 'publica', 'privada');
    });

    // Assinatura expirada ou revogada: reentregar não adianta, então o QStash
    // precisa receber 2xx para parar de tentar.
    it.each([404, 410])('trata assinatura expirada (%i) como entregue', async (statusCode) => {
        webpush.sendNotification.mockRejectedValue({ statusCode });
        const res = makeRes();

        await handler(req({ subscription: assinatura, secret: SEGREDO }), res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ ok: false, expired: true });
    });

    it('responde 502 em outra falha de envio, para o QStash reentregar', async () => {
        webpush.sendNotification.mockRejectedValue({ statusCode: 500 });
        const res = makeRes();

        await handler(req({ subscription: assinatura, secret: SEGREDO }), res);

        expect(res.statusCode).toBe(502);
    });
});
