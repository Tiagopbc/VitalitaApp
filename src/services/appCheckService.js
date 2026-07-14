import { app } from '../firebaseApp';
import { getAppCheckRuntimeConfig } from '../utils/appCheck';
import { captureTechnicalError } from './observabilityService';

const runtimeConfig = getAppCheckRuntimeConfig({
    siteKey: import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY,
    isProduction: import.meta.env.PROD,
    debugMode: import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG,
    hasWindow: typeof window !== 'undefined'
});

let appCheckPromise;

export function isAppCheckMonitoringEnabled() {
    return runtimeConfig.enabled;
}

export async function initializeAppCheckMonitoring() {
    if (!runtimeConfig.enabled) return null;

    if (!appCheckPromise) {
        if (runtimeConfig.debugEnabled) {
            globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        }

        appCheckPromise = import('firebase/app-check')
            .then(({ initializeAppCheck, ReCaptchaEnterpriseProvider }) => initializeAppCheck(app, {
                provider: new ReCaptchaEnterpriseProvider(runtimeConfig.siteKey),
                isTokenAutoRefreshEnabled: true
            }))
            .catch((error) => {
                captureTechnicalError(error, {
                    operation: 'app_check_init_failed',
                    source: 'app_check'
                });
                return null;
            });
    }

    return appCheckPromise;
}
