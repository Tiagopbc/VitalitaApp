import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const createMock = vi.fn();
const jwtVerifyMock = vi.fn();

// Precisa ser construtível (`new Anthropic(...)`), por isso classe e não arrow function.
vi.mock('@anthropic-ai/sdk', () => ({
    default: class {
        constructor() {
            this.messages = { create: createMock };
        }
    }
}));

vi.mock('jose', () => ({
    createRemoteJWKSet: vi.fn(() => 'JWKS'),
    jwtVerify: (...args) => jwtVerifyMock(...args)
}));

// Import após os mocks (o handler importa jose e @anthropic-ai/sdk no topo).
const { default: handler } = await import('./parse-workout-pdf');

function makeRes() {
    const res = {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; }
    };
    return res;
}

function makeReq(overrides = {}) {
    return {
        method: 'POST',
        headers: { authorization: 'Bearer token-valido' },
        body: { pdfBase64: 'ZmFrZS1wZGY=' },
        ...overrides
    };
}

const toolResponse = {
    content: [{
        type: 'tool_use',
        name: 'registrar_treino',
        input: {
            name: 'Treino A - Peito',
            exercises: [
                { muscleGroup: 'Peito', name: 'Supino Reto', sets: '4', reps: '8-10', method: 'Convencional', rest: '90s', targetWeight: '40' }
            ]
        }
    }]
};

describe('/api/parse-workout-pdf', () => {
    beforeEach(() => {
        process.env.ANTHROPIC_API_KEY = 'key-teste';
        process.env.FIREBASE_PROJECT_ID = 'demo-vitalita';
        jwtVerifyMock.mockResolvedValue({ payload: { sub: 'uid-1' } });
        createMock.mockResolvedValue(toolResponse);
    });

    afterEach(() => {
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.FIREBASE_PROJECT_ID;
        vi.clearAllMocks();
    });

    it('rejeita métodos diferentes de POST', async () => {
        const res = makeRes();
        await handler({ method: 'GET' }, res);
        expect(res.statusCode).toBe(405);
    });

    it('responde 503 sem configuração', async () => {
        delete process.env.ANTHROPIC_API_KEY;
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(503);
    });

    it('responde 401 sem token', async () => {
        const res = makeRes();
        await handler(makeReq({ headers: {} }), res);
        expect(res.statusCode).toBe(401);
    });

    it('responde 401 quando o token é inválido', async () => {
        jwtVerifyMock.mockRejectedValueOnce(new Error('bad token'));
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(401);
    });

    it('responde 400 sem pdfBase64', async () => {
        const res = makeRes();
        await handler(makeReq({ body: {} }), res);
        expect(res.statusCode).toBe(400);
    });

    it('devolve a ficha estruturada em 200', async () => {
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Treino A - Peito');
        expect(res.body.exercises).toHaveLength(1);
        expect(res.body.exercises[0]).toMatchObject({
            muscleGroup: 'Peito',
            name: 'Supino Reto',
            targetWeight: '40'
        });
    });

    it('sanitiza grupo muscular e método inválidos', async () => {
        createMock.mockResolvedValueOnce({
            content: [{
                type: 'tool_use',
                name: 'registrar_treino',
                input: {
                    name: 'X',
                    exercises: [{ muscleGroup: 'Inexistente', name: 'Exercício', sets: '3', reps: '10', method: 'Método Zé' }]
                }
            }]
        });
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(200);
        expect(res.body.exercises[0].muscleGroup).toBe('Geral');
        expect(res.body.exercises[0].method).toBe('Convencional');
    });

    it('responde 422 quando nenhum exercício é encontrado', async () => {
        createMock.mockResolvedValueOnce({
            content: [{ type: 'tool_use', name: 'registrar_treino', input: { name: 'Vazio', exercises: [] } }]
        });
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(422);
    });

    it('responde 502 quando a IA falha', async () => {
        createMock.mockRejectedValueOnce(new Error('anthropic down'));
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(502);
    });

    describe('saldo esgotado', () => {
        // A Anthropic sinaliza falta de saldo de formas diferentes; todas devem
        // virar 402 para o cliente exibir a mensagem neutra de "avise o suporte".
        it('reconhece 400 citando o saldo', async () => {
            const err = Object.assign(new Error('Your credit balance is too low to access the Anthropic API'), { status: 400 });
            createMock.mockRejectedValueOnce(err);
            const res = makeRes();
            await handler(makeReq(), res);
            expect(res.statusCode).toBe(402);
            expect(res.body.error).toBe('ai_billing');
        });

        it('reconhece type billing_error', async () => {
            const err = Object.assign(new Error('billing issue'), { status: 403, type: 'billing_error' });
            createMock.mockRejectedValueOnce(err);
            const res = makeRes();
            await handler(makeReq(), res);
            expect(res.statusCode).toBe(402);
        });

        it('reconhece status 402 direto', async () => {
            createMock.mockRejectedValueOnce(Object.assign(new Error('payment required'), { status: 402 }));
            const res = makeRes();
            await handler(makeReq(), res);
            expect(res.statusCode).toBe(402);
        });

        it('não confunde erro comum de 400 com falta de saldo', async () => {
            createMock.mockRejectedValueOnce(Object.assign(new Error('invalid document format'), { status: 400 }));
            const res = makeRes();
            await handler(makeReq(), res);
            expect(res.statusCode).toBe(502);
        });
    });

    it('responde 429 quando a IA limita a taxa', async () => {
        createMock.mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429 }));
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(429);
        expect(res.body.error).toBe('ai_rate_limited');
    });
});
