import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    captureTechnicalError: vi.fn(),
    initializeAppCheck: vi.fn(() => ({ type: 'app-check' })),
    provider: vi.fn(function ReCaptchaEnterpriseProvider(siteKey) {
        this.siteKey = siteKey;
    })
}));

vi.mock('../firebaseApp', () => ({ app: { name: 'test-app' } }));
vi.mock('./observabilityService', () => ({
    captureTechnicalError: mocks.captureTechnicalError
}));
vi.mock('firebase/app-check', () => ({
    initializeAppCheck: mocks.initializeAppCheck,
    ReCaptchaEnterpriseProvider: mocks.provider
}));

describe('appCheckService', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
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
    });
});
