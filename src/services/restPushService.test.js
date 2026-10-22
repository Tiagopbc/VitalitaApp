import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../firebaseAuth', () => ({
    auth: { currentUser: null }
}));
vi.mock('./pushDiagnostics', () => ({
    logPush: vi.fn(),
    describePushContext: vi.fn()
}));

import { scheduleRestPush, MIN_PUSH_DELAY_SECONDS } from './restPushService';
import { auth } from '../firebaseAuth';

/**
 * `RestTimer` consome o retorno com `request.then(({ messageId, reason }) => ...)`,
 * sem `catch`. Qualquer caminho que devolva algo não desestruturável lança
 * TypeError dentro do `then`: o pedido fica marcado como pendente para sempre e
 * o aviso de "sem notificação em segundo plano" nunca aparece.
 */
function ligarSuporteAPush() {
    const subscription = {
        endpoint: 'https://push.example.com/sub/abc',
        toJSON: () => ({ endpoint: 'https://push.example.com/sub/abc', keys: {} })
    };
    vi.stubGlobal('navigator', {
        serviceWorker: {
            ready: Promise.resolve({
                pushManager: {
                    getSubscription: async () => subscription,
                    subscribe: async () => subscription
                }
            })
        }
    });
    vi.stubGlobal('PushManager', function PushManager() {});
    vi.stubGlobal('Notification', { permission: 'granted' });
}

describe('scheduleRestPush — formato do retorno', () => {
    beforeEach(() => {
        auth.currentUser = null;
        ligarSuporteAPush();
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('devolve objeto desestruturável quando o delay é curto demais', async () => {
        const r = await scheduleRestPush(MIN_PUSH_DELAY_SECONDS - 1);
        expect(r).toMatchObject({ messageId: null, reason: 'below-min-delay' });
    });

    it('devolve objeto desestruturável quando não há sessão', async () => {
        auth.currentUser = null;
        const r = await scheduleRestPush(60);

        expect(r).not.toBeNull();
        expect(() => {
            const { messageId, reason } = r;
            return [messageId, reason];
        }).not.toThrow();
        expect(r.messageId).toBeNull();
        expect(r.reason).toBeTruthy();
    });

    it('não chega a chamar o backend sem sessão', async () => {
        auth.currentUser = null;
        await scheduleRestPush(60);
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    // 'below-min-delay' é silencioso e 'permission' tem aviso próprio; qualquer
    // outro motivo faz o RestTimer avisar que não há aviso em segundo plano.
    it('usa um motivo que faz o timer avisar o usuário', async () => {
        auth.currentUser = null;
        const { reason } = await scheduleRestPush(60);
        expect(reason).not.toBe('below-min-delay');
        expect(reason).not.toBe('permission');
    });

    it('devolve objeto desestruturável quando getIdToken falha', async () => {
        auth.currentUser = { getIdToken: vi.fn().mockRejectedValue(new Error('token expirado')) };
        const r = await scheduleRestPush(60);
        expect(r).not.toBeNull();
        expect(r.messageId).toBeNull();
        expect(r.reason).toBeTruthy();
    });

    it('agenda normalmente quando há sessão', async () => {
        auth.currentUser = { getIdToken: vi.fn().mockResolvedValue('token-valido') };
        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ messageId: 'msg_1' })
        });

        const r = await scheduleRestPush(60);

        expect(r).toEqual({ messageId: 'msg_1', reason: null });
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/schedule-rest-push', expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer token-valido' })
        }));
    });
});
