/**
 * restPushService.js
 * Agenda/cancela o push de fim de descanso via backend (/api + QStash).
 * Tudo é melhor esforço: sem suporte, sem permissão ou sem backend
 * (ex.: dev local), as funções retornam null e o timer segue com os
 * alertas locais de restTimerAlerts.js.
 *
 * iOS: push só funciona com o app instalado na tela de início (iOS 16.4+).
 */
import { logPush } from './pushDiagnostics';

// Chave pública VAPID (par gerado para o projeto; a privada fica só na Vercel).
const VAPID_PUBLIC_KEY = 'BKWPJhj3txwL6uTei-NeO6IgJYD-9NvRvhvnnhBXgTko8z2xqfr2DXvTfkNhNAc5fDmV0jkFKhyPPyMktslDiRg';

// Piso do delay: precisa bater com MIN_DELAY_SECONDS em api/schedule-rest-push.js.
// Abaixo disso o servidor rejeita (400) e o timer cai só nos alertas locais.
export const MIN_PUSH_DELAY_SECONDS = 5;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function isPushSupported() {
    return typeof window !== 'undefined'
        && 'serviceWorker' in navigator
        && 'PushManager' in window
        && 'Notification' in window;
}

// A primeira assinatura envolve registro no serviço de push do sistema e pode
// levar segundos; o cache permite agendar com uma única requisição depois.
let cachedSubscription = null;

/**
 * Garante uma assinatura de push VÁLIDA. No iOS a assinatura pode ser
 * rotacionada/revogada pelo sistema; se a atual sumir, re-inscreve — do
 * contrário o servidor recebe 410 e o push some em silêncio.
 */
async function getPushSubscription() {
    const registration = await navigator.serviceWorker.ready;

    // Revalida contra o pushManager (fonte da verdade), não só o cache local.
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
        if (!cachedSubscription || cachedSubscription.endpoint !== existing.endpoint) {
            logPush('subscription:loaded', { endpoint: shortEndpoint(existing.endpoint) });
        }
        cachedSubscription = existing;
        return existing;
    }

    // Assinatura sumiu (ou primeira vez): (re)inscreve.
    const created = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    logPush(cachedSubscription ? 'subscription:renewed' : 'subscription:created', {
        endpoint: shortEndpoint(created.endpoint)
    });
    cachedSubscription = created;
    return created;
}

function shortEndpoint(endpoint) {
    if (typeof endpoint !== 'string') return null;
    return endpoint.slice(0, 40) + (endpoint.length > 40 ? '…' : '');
}

/**
 * Pré-aquece a assinatura (chamar ao abrir o timer, com o app ativo), para
 * que o agendamento em si seja uma única requisição rápida.
 */
export async function warmRestPushSubscription() {
    if (!isPushSupported()) {
        logPush('warm:skip', { reason: 'unsupported' });
        return false;
    }
    if (Notification.permission !== 'granted') {
        logPush('warm:skip', { reason: 'permission', permission: Notification.permission });
        return false;
    }
    try {
        await getPushSubscription();
        return true;
    } catch (err) {
        logPush('warm:error', { message: String(err?.message || err) });
        return false;
    }
}

/**
 * Agenda o push para daqui a `delaySeconds`. Retorna o messageId (para
 * cancelamento) ou null quando indisponível.
 */
export async function scheduleRestPush(delaySeconds) {
    if (!isPushSupported()) {
        logPush('schedule:skip', { reason: 'unsupported' });
        return null;
    }
    if (Notification.permission !== 'granted') {
        logPush('schedule:skip', { reason: 'permission', permission: Notification.permission });
        return null;
    }

    const delay = Math.round(delaySeconds);
    if (!Number.isFinite(delay) || delay < MIN_PUSH_DELAY_SECONDS) {
        // Descanso curto demais para o backend (piso de 5s): só alerta local.
        logPush('schedule:skip', { reason: 'below-min-delay', delay });
        return null;
    }

    try {
        const subscription = await getPushSubscription();
        const response = await fetch('/api/schedule-rest-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscription: subscription.toJSON(),
                delaySeconds: delay
            }),
            // keepalive: o navegador completa o envio mesmo se o app for
            // suspenso logo depois (usuário bloqueando a tela em seguida).
            keepalive: true
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            logPush('schedule:fail', {
                status: response.status,
                error: body?.error || null,
                qstashStatus: body?.qstashStatus ?? null
            });
            return null;
        }
        const data = await response.json().catch(() => null);
        if (data?.messageId) {
            logPush('schedule:ok', { delay, messageId: data.messageId });
            return data.messageId;
        }
        logPush('schedule:fail', { status: response.status, error: 'no-message-id' });
        return null;
    } catch (err) {
        logPush('schedule:error', { message: String(err?.message || err) });
        return null;
    }
}

/**
 * Cancela um push agendado. Silencioso: se já foi entregue/cancelado, ok.
 */
export async function cancelRestPush(messageId) {
    if (!messageId) return;
    try {
        await fetch('/api/cancel-rest-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId }),
            keepalive: true
        });
        logPush('cancel:ok', { messageId });
    } catch {
        // Melhor esforço.
        logPush('cancel:error', { messageId });
    }
}
