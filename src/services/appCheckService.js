import { app } from '../firebaseApp';
import { getAppCheckRuntimeConfig } from '../utils/appCheck';
import { captureTechnicalError } from './observabilityService';
import { recordAppCheckStatus } from './appCheckDiagnostics';

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

/**
 * Confirma que o token é realmente emitido, e não só que o SDK inicializou.
 *
 * Essa distinção é o motivo desta função existir: no incidente de 21/07 a
 * 07/08/2026 a inicialização passava normalmente e a falha (403) só aparecia na
 * troca do token, onde o SDK apenas emite `console.warn`. Ver MANUAL_TECNICO.md §7.3.
 *
 * Nunca lança e nunca é aguardada — falha de diagnóstico não pode virar falha
 * de boot.
 */
function verifyToken(getToken, appCheck) {
    if (typeof getToken !== 'function') return;

    try {
        Promise.resolve(getToken(appCheck))
            .then(() => recordAppCheckStatus({ ok: true }))
            .catch((error) => {
                recordAppCheckStatus({ ok: false, code: error?.code, message: error?.message });
                captureTechnicalError(error, {
                    operation: 'app_check_token_failed',
                    source: 'app_check'
                });
            });
    } catch (error) {
        recordAppCheckStatus({ ok: false, code: error?.code, message: error?.message });
    }
}

export async function initializeAppCheckMonitoring() {
    if (!runtimeConfig.enabled) return null;

    if (!appCheckPromise) {
        if (runtimeConfig.debugEnabled) {
            globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        }

        appCheckPromise = import('firebase/app-check')
            .then(({ initializeAppCheck, ReCaptchaEnterpriseProvider, getToken }) => {
                const appCheck = initializeAppCheck(app, {
                    provider: new ReCaptchaEnterpriseProvider(runtimeConfig.siteKey),
                    isTokenAutoRefreshEnabled: true
                });

                // Intencionalmente sem `await`: `main.jsx` espera esta promise
                // antes de renderizar, e encadear a busca de token aqui
                // atrasaria o primeiro render pelo tempo do reCAPTCHA + rede.
                verifyToken(getToken, appCheck);

                return appCheck;
            })
            .catch((error) => {
                recordAppCheckStatus({ ok: false, code: error?.code, message: error?.message });
                captureTechnicalError(error, {
                    operation: 'app_check_init_failed',
                    source: 'app_check'
                });
                return null;
            });
    }

    return appCheckPromise;
}
