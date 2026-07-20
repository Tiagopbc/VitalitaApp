/**
 * pushDiagnostics.js
 * Log leve e persistente do pipeline de push do descanso, para diagnosticar
 * (num treino real, sem cabo/console) EM QUAL etapa a entrega falha.
 *
 * Tudo aqui é "melhor esforço" e nunca pode lançar: diagnóstico jamais deve
 * quebrar o timer. Roda apenas no contexto da janela (usa localStorage).
 */

const STORAGE_KEY = 'vitalita:pushLog';
const MAX_ENTRIES = 40;

function safeParse(raw) {
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Registra um evento do pipeline de push. `stage` é um rótulo curto
 * (ex.: 'schedule:ok', 'schedule:503', 'subscription:renewed', 'sw:received');
 * `detail` é qualquer dado serializável para contexto.
 */
export function logPush(stage, detail) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
        const log = safeParse(localStorage.getItem(STORAGE_KEY));
        log.push({
            t: new Date().toISOString(),
            stage,
            detail: detail === undefined ? null : detail,
            vis: typeof document !== 'undefined' ? document.visibilityState : null
        });
        // Mantém só os últimos N eventos (log circular).
        while (log.length > MAX_ENTRIES) log.shift();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch {
        // Sem storage (modo privado/quota): diagnóstico é opcional.
    }
}

/** Retorna os eventos registrados (mais antigo → mais recente). */
export function getPushLog() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
    return safeParse(localStorage.getItem(STORAGE_KEY));
}

/**
 * Registra um listener sempre-ativo para as mensagens que o service worker
 * envia quando um push chega ao dispositivo (ver public/push-sw.js). Assim o
 * log marca 'sw:received' mesmo que o app estivesse em segundo plano — a
 * mensagem é entregue quando a aba volta a rodar. Chamar uma vez no boot.
 */
export function initPushDiagnostics() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event?.data?.type === 'rest-push-received') {
                logPush('sw:received', event.data.detail || null);
            }
        });
    } catch {
        // Diagnóstico é opcional.
    }
}

/** Limpa o log. */
export function clearPushLog() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}

/**
 * Descreve o contexto de instalação para o push. No iOS, Web Push (16.4+) só
 * funciona em PWA adicionado à tela de início pelo Safari — atalho do Chrome
 * nunca recebe push. Serve tanto para o log quanto para orientar o usuário.
 *
 * Retorna: { platform, isIOS, isStandalone, browser, pushViable, reason }
 */
export function describePushContext() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return { platform: 'ssr', isIOS: false, isStandalone: false, browser: 'unknown', pushViable: false, reason: 'ssr' };
    }

    const ua = navigator.userAgent || '';
    const isIOS = /iP(hone|ad|od)/.test(ua)
        // iPadOS moderno se apresenta como Mac com touch.
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isStandalone = window.navigator.standalone === true
        || (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches);

    // Detecção grosseira só para mensagem ao usuário (UA de iOS mente bastante).
    let browser = 'safari';
    if (/CriOS/.test(ua)) browser = 'chrome';
    else if (/FxiOS/.test(ua)) browser = 'firefox';
    else if (/EdgiOS/.test(ua)) browser = 'edge';
    else if (/Chrome/.test(ua) && !isIOS) browser = 'chrome';

    const hasPushApi = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

    let pushViable = hasPushApi;
    let reason = null;
    if (!hasPushApi) {
        pushViable = false;
        reason = 'no-push-api';
    } else if (isIOS && !isStandalone) {
        // No iOS, precisa estar instalado na tela de início (via Safari).
        pushViable = false;
        reason = 'ios-not-standalone';
    }

    return { platform: isIOS ? 'ios' : 'other', isIOS, isStandalone, browser, pushViable, reason };
}
