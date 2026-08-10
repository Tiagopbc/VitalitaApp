import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    captureTechnicalError: vi.fn(),
    initializeAppCheck: vi.fn(() => ({ type: 'app-check' })),
    getToken: vi.fn(() => Promise.resolve({ token: 'app-check-token' })),
    recordAppCheckStatus: vi.fn(),
    provider: vi.fn(function ReCaptchaEnterpriseProvider(siteKey) {
        this.siteKey = siteKey;
    })
}));

vi.mock('../firebaseApp', () => ({ app: { name: 'test-app' } }));
vi.mock('./observabilityService', () => ({
    captureTechnicalError: mocks.captureTechnicalError
}));
vi.mock('./appCheckDiagnostics', () => ({
    recordAppCheckStatus: mocks.recordAppCheckStatus
}));
vi.mock('firebase/app-check', () => ({
    initializeAppCheck: mocks.initializeAppCheck,
    ReCaptchaEnterpriseProvider: mocks.provider,
    getToken: mocks.getToken
}));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('appCheckService', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        mocks.getToken.mockResolvedValue({ token: 'app-check-token' });
        vi.stubEnv('VITE_FIREBASE_APP_CHECK_DEBUG', 'false');
        delete globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN;
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        delete globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN;
    });

    it('is a no-op when no site key is configured', async () => {
        vi.stubEnv('PROD', true);
        vi.stubEnv('VITE_FIREBASE_APP_CHECK_SITE_KEY', '');
        const service = await import('./appCheckService');

        await expect(service.initializeAppCheckMonitoring()).resolves.toBeNull();
        expect(service.isAppCheckMonitoringEnabled()).toBe(false);
        expect(mocks.initializeAppCheck).not.toHaveBeenCalled();
    });

    it('initializes the Enterprise provider in production', async () => {
        vi.stubEnv('PROD', true);
        vi.stubEnv('VITE_FIREBASE_APP_CHECK_SITE_KEY', 'public-site-key');
        const service = await import('./appCheckService');

        await expect(service.initializeAppCheckMonitoring()).resolves.toEqual({ type: 'app-check' });
        await expect(service.initializeAppCheckMonitoring()).resolves.toEqual({ type: 'app-check' });
        expect(service.isAppCheckMonitoringEnabled()).toBe(true);
        expect(mocks.provider).toHaveBeenCalledWith('public-site-key');
        expect(mocks.initializeAppCheck).toHaveBeenCalledWith(
            { name: 'test-app' },
            expect.objectContaining({ isTokenAutoRefreshEnabled: true })
        );
        expect(mocks.initializeAppCheck).toHaveBeenCalledTimes(1);
    });

    it('enables the debug provider only after an explicit local opt-in', async () => {
        vi.stubEnv('PROD', false);
        vi.stubEnv('VITE_FIREBASE_APP_CHECK_SITE_KEY', 'public-site-key');
        vi.stubEnv('VITE_FIREBASE_APP_CHECK_DEBUG', 'true');
        const service = await import('./appCheckService');

        await expect(service.initializeAppCheckMonitoring()).resolves.toEqual({ type: 'app-check' });
        expect(globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN).toBe(true);
    });

    it('grava sucesso quando o token é emitido', async () => {
        vi.stubEnv('PROD', true);
        vi.stubEnv('VITE_FIREBASE_APP_CHECK_SITE_KEY', 'public-site-key');
        const service = await import('./appCheckService');

        await service.initializeAppCheckMonitoring();
        await flush();

        expect(mocks.getToken).toHaveBeenCalledWith({ type: 'app-check' });
        expect(mocks.recordAppCheckStatus).toHaveBeenCalledWith({ ok: true });
        expect(mocks.captureTechnicalError).not.toHaveBeenCalled();
    });

    // O buraco que este trabalho fecha: a inicialização passava e a falha só
    // aparecia aqui, como console.warn que ninguém vê.
    it('reporta falha na obtenção do token, que a inicialização não pega', async () => {
        const error = Object.assign(new Error('403'), { code: 'appCheck/fetch-status-error' });
        mocks.getToken.mockRejectedValueOnce(error);
        vi.stubEnv('PROD', true);
        vi.stubEnv('VITE_FIREBASE_APP_CHECK_SITE_KEY', 'public-site-key');
        const service = await import('./appCheckService');

        await expect(service.initializeAppCheckMonitoring()).resolves.toEqual({ type: 'app-check' });
        await flush();

        expect(mocks.recordAppCheckStatus).toHaveBeenCalledWith({
            ok: false,
            code: 'appCheck/fetch-status-error',
            message: '403'
        });
        expect(mocks.captureTechnicalError).toHaveBeenCalledWith(error, {
            operation: 'app_check_token_failed',
            source: 'app_check'
        });
    });

    // `main.jsx` dá await nesta promise antes de renderizar: encadear o getToken
    // aqui atrasaria o primeiro render pelo tempo do reCAPTCHA + rede.
    it('resolve sem esperar a verificação do token', async () => {
        let liberarToken;
        mocks.getToken.mockImplementationOnce(() => new Promise(resolve => { liberarToken = resolve; }));
        vi.stubEnv('PROD', true);
        vi.stubEnv('VITE_FIREBASE_APP_CHECK_SITE_KEY', 'public-site-key');
        const service = await import('./appCheckService');

        await expect(service.initializeAppCheckMonitoring()).resolves.toEqual({ type: 'app-check' });
        expect(mocks.recordAppCheckStatus).not.toHaveBeenCalled();

        liberarToken({ token: 'app-check-token' });
        await flush();
        expect(mocks.recordAppCheckStatus).toHaveBeenCalledWith({ ok: true });
    });

    it('não verifica token quando o App Check está desligado', async () => {
        vi.stubEnv('PROD', true);
        vi.stubEnv('VITE_FIREBASE_APP_CHECK_SITE_KEY', '');
        const service = await import('./appCheckService');

        await service.initializeAppCheckMonitoring();
        await flush();

        expect(mocks.getToken).not.toHaveBeenCalled();
        expect(mocks.recordAppCheckStatus).not.toHaveBeenCalled();
    });

    it('reports initialization errors without rejecting application startup', async () => {
        const error = new Error('provider unavailable');
        mocks.initializeAppCheck.mockImplementationOnce(() => {
            throw error;
        });
        vi.stubEnv('PROD', true);
        vi.stubEnv('VITE_FIREBASE_APP_CHECK_SITE_KEY', 'public-site-key');
        const service = await import('./appCheckService');

        await expect(service.initializeAppCheckMonitoring()).resolves.toBeNull();
        expect(mocks.captureTechnicalError).toHaveBeenCalledWith(error, {
            operation: 'app_check_init_failed',
            source: 'app_check'
        });
        expect(mocks.recordAppCheckStatus).toHaveBeenCalledWith({
            ok: false,
            code: undefined,
            message: 'provider unavailable'
        });
    });
});
