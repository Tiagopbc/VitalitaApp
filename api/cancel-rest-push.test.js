import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('./_lib/firebaseToken', () => ({
    requireFirebaseUser: vi.fn()
}));

import handler from './cancel-rest-push';
import { requireFirebaseUser } from './_lib/firebaseToken';

function makeRes() {
    return {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; }
    };
}

function req(body, metodo = 'POST') {
    return { method: metodo, body, headers: { authorization: 'Bearer token-valido' } };
}

describe('/api/cancel-rest-push', () => {
    beforeEach(() => {
        process.env.QSTASH_TOKEN = 'token-teste';
        requireFirebaseUser.mockResolvedValue({ sub: 'uid-123' });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
        delete process.env.QSTASH_TOKEN;
    });

    it('rejeita métodos diferentes de POST', async () => {
        const res = makeRes();
        await handler(req({ messageId: 'msg_1' }, 'GET'), res);
        expect(res.statusCode).toBe(405);
    });

    // O endpoint é um proxy para o DELETE do QStash com o token do servidor.
    // Sem autenticação, qualquer um cancelaria a entrega de outra pessoa.
    it('exige usuário autenticado antes de falar com o QStash', async () => {
        const res = makeRes();
        requireFirebaseUser.mockImplementation(async (_r, resposta) => {
            resposta.status(401).json({ error: 'unauthorized' });
            return null;
        });

        await handler(req({ messageId: 'msg_1' }), res);

        expect(res.statusCode).toBe(401);
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('verifica a autenticação antes de validar o corpo', async () => {
        const res = makeRes();
        requireFirebaseUser.mockImplementation(async (_r, resposta) => {
            resposta.status(401).json({ error: 'unauthorized' });
            return null;
        });

        await handler(req({ messageId: '../../rota-perigosa' }), res);

        expect(res.statusCode).toBe(401);
    });

    it('responde 503 sem o token do QStash configurado', async () => {
        delete process.env.QSTASH_TOKEN;
        const res = makeRes();
        await handler(req({ messageId: 'msg_1' }), res);
        expect(res.statusCode).toBe(503);
    });

    it('recusa messageId fora do formato', async () => {
        for (const ruim of ['', '../outro', 'a'.repeat(129), 'com espaço', null, 42]) {
            const res = makeRes();
            await handler(req({ messageId: ruim }), res);
            expect(res.statusCode).toBe(400);
        }
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('cancela no QStash e responde ok', async () => {
        const res = makeRes();
        await handler(req({ messageId: 'msg_abc-123' }), res);

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('msg_abc-123'),
            expect.objectContaining({ method: 'DELETE' })
        );
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });

    // 404 do QStash significa entrega já feita ou já cancelada.
    it('trata 404 do QStash como sucesso', async () => {
        globalThis.fetch.mockResolvedValue({ ok: false, status: 404 });
        const res = makeRes();
        await handler(req({ messageId: 'msg_1' }), res);
        expect(res.statusCode).toBe(200);
    });

    it('responde 502 quando o QStash falha de outro jeito', async () => {
        globalThis.fetch.mockResolvedValue({ ok: false, status: 500 });
        const res = makeRes();
        await handler(req({ messageId: 'msg_1' }), res);
        expect(res.statusCode).toBe(502);
    });

    it('responde 502 quando o QStash não responde', async () => {
        globalThis.fetch.mockRejectedValue(new Error('rede caiu'));
        const res = makeRes();
        await handler(req({ messageId: 'msg_1' }), res);
        expect(res.statusCode).toBe(502);
    });
});
