import { describe, it, expect, afterEach, vi } from 'vitest';

// O web-push 4 virou ESM e só exporta com nome (sem `default`); o 3 só tinha o
// `default` (CommonJS). A função precisa funcionar com os dois: com
// `import webpush from 'web-push'`, o 4 derrubava o push de descanso.
// Este arquivo simula o formato do 4; send-rest-push.test.js, o do 3.
// `default: undefined` reproduz o namespace real do 4 (ler `default` dá
// undefined); sem a chave, o mock do Vitest acusa a leitura como erro.
vi.mock('web-push', () => ({
    default: undefined,
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 })
}));

import handler from './send-rest-push';
import * as webpush from 'web-push';

const SEGREDO = 'segredo-interno-teste';

describe('/api/send-rest-push com o formato do web-push 4', () => {
    afterEach(() => {
        delete process.env.VAPID_PUBLIC_KEY;
        delete process.env.VAPID_PRIVATE_KEY;
        delete process.env.PUSH_INTERNAL_SECRET;
    });

    it('envia a notificação usando os exports com nome', async () => {
        process.env.VAPID_PUBLIC_KEY = 'publica';
        process.env.VAPID_PRIVATE_KEY = 'privada';
        process.env.PUSH_INTERNAL_SECRET = SEGREDO;
        const res = { statusCode: null, status(c) { this.statusCode = c; return this; }, json() { return this; } };

        await handler({
            method: 'POST',
            body: { secret: SEGREDO, subscription: { endpoint: 'https://push.example.com/abc', keys: { p256dh: 'p', auth: 'a' } } }
        }, res);

        expect(webpush.setVapidDetails).toHaveBeenCalledWith(expect.any(String), 'publica', 'privada');
        expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
    });
});
