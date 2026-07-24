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

// Monta a resposta de tool_use da Anthropic a partir dos treinos informados.
function toolResp(workouts) {
    return { content: [{ type: 'tool_use', name: 'registrar_treinos', input: { workouts } }] };
}

const toolResponse = toolResp([
    {
        name: 'Treino A - Peito',
        exercises: [
            { muscleGroup: 'Peito', name: 'Supino Reto', sets: '4', reps: '8-10', method: 'Convencional', rest: '90s', targetWeight: '40' }
        ]
    }
]);

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

    it('devolve os treinos estruturados em 200', async () => {
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(200);
        expect(res.body.workouts).toHaveLength(1);
        expect(res.body.workouts[0].name).toBe('Treino A - Peito');
        expect(res.body.workouts[0].exercises[0]).toMatchObject({
            muscleGroup: 'Peito',
            name: 'Supino Reto',
            targetWeight: '40',
            groupedWithPrevious: false
        });
    });

    it('devolve vários treinos (A, B, C) do mesmo PDF', async () => {
        createMock.mockResolvedValueOnce(toolResp([
            { name: 'Treino A', exercises: [{ name: 'Puxada', sets: '4', reps: '15' }] },
            { name: 'Treino B', exercises: [{ name: 'Agachamento', sets: '4', reps: '15' }] },
            { name: 'Treino C', exercises: [{ name: 'Supino', sets: '4', reps: '15' }] }
        ]));
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(200);
        expect(res.body.workouts.map(w => w.name)).toEqual(['Treino A', 'Treino B', 'Treino C']);
    });

    it('sanitiza grupo muscular e método inválidos', async () => {
        createMock.mockResolvedValueOnce(toolResp([
            { name: 'X', exercises: [{ muscleGroup: 'Inexistente', name: 'Exercício', sets: '3', reps: '10', method: 'Método Zé' }] }
        ]));
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(200);
        expect(res.body.workouts[0].exercises[0].muscleGroup).toBe('Geral');
        expect(res.body.workouts[0].exercises[0].method).toBe('Convencional');
    });

    it('responde 422 quando nenhum exercício é encontrado', async () => {
        createMock.mockResolvedValueOnce(toolResp([{ name: 'Vazio', exercises: [] }]));
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(422);
    });

    describe('decomposição de bi-set/tri-set', () => {
        it('quebra "A + B" num bi-set de dois exercícios ligados', async () => {
            createMock.mockResolvedValueOnce(toolResp([{
                name: 'Treino A',
                exercises: [{
                    muscleGroup: 'Costas',
                    name: 'Bi-set: Puxada pela frente pronada + puxada pegada supinada',
                    sets: '4', reps: '15', method: 'Bi-set'
                }]
            }]));
            const res = makeRes();
            await handler(makeReq(), res);
            const ex = res.body.workouts[0].exercises;
            expect(ex).toHaveLength(2);
            expect(ex[0]).toMatchObject({ name: 'Puxada pela frente pronada', method: 'Bi-set', groupedWithPrevious: false });
            expect(ex[1]).toMatchObject({ name: 'puxada pegada supinada', method: 'Bi-set', groupedWithPrevious: true });
        });

        it('quebra tri-set em três exercícios, todos ligados em cadeia', async () => {
            createMock.mockResolvedValueOnce(toolResp([{
                name: 'Treino C',
                exercises: [{ name: 'Tri-set - A + B + C', sets: '4', reps: '12', method: 'Bi-set' }]
            }]));
            const res = makeRes();
            await handler(makeReq(), res);
            const ex = res.body.workouts[0].exercises;
            expect(ex.map(e => e.name)).toEqual(['A', 'B', 'C']);
            expect(ex.map(e => e.groupedWithPrevious)).toEqual([false, true, true]);
        });

        it('honra groupedWithPrevious já vindo da IA (exercícios separados)', async () => {
            createMock.mockResolvedValueOnce(toolResp([{
                name: 'Treino A',
                exercises: [
                    { name: 'Abdominal supra solo', sets: '4', reps: '15', method: 'Bi-set' },
                    { name: 'Abdominal infra solo', sets: '4', reps: '15', method: 'Bi-set', groupedWithPrevious: true }
                ]
            }]));
            const res = makeRes();
            await handler(makeReq(), res);
            const ex = res.body.workouts[0].exercises;
            expect(ex.map(e => e.groupedWithPrevious)).toEqual([false, true]);
        });

        it('NÃO quebra drop-set cujas reps têm "+" (10+12+15)', async () => {
            createMock.mockResolvedValueOnce(toolResp([{
                name: 'Treino A',
                exercises: [{ name: 'Remada cavalinho', sets: '4', reps: '10+12+15', method: 'Drop-set' }]
            }]));
            const res = makeRes();
            await handler(makeReq(), res);
            const ex = res.body.workouts[0].exercises;
            expect(ex).toHaveLength(1);
            expect(ex[0]).toMatchObject({ name: 'Remada cavalinho', reps: '10+12+15', method: 'Drop-set' });
        });
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
