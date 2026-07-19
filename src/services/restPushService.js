/**
 * restPushService.js
 * Agenda/cancela o push de fim de descanso via backend (/api + QStash).
 * Tudo é melhor esforço: sem suporte, sem permissão ou sem backend
 * (ex.: dev local), as funções retornam null e o timer segue com os
 * alertas locais de restTimerAlerts.js.
 *
 * iOS: push só funciona com o app instalado na tela de início (iOS 16.4+).
 */

// Chave pública VAPID (par gerado para o projeto; a privada fica só na Vercel).
const VAPID_PUBLIC_KEY = 'BKWPJhj3txwL6uTei-NeO6IgJYD-9NvRvhvnnhBXgTko8z2xqfr2DXvTfkNhNAc5fDmV0jkFKhyPPyMktslDiRg';

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

async function getPushSubscription() {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
}

/**
 * Agenda o push para daqui a `delaySeconds`. Retorna o messageId (para
 * cancelamento) ou null quando indisponível.
 */
export async function scheduleRestPush(delaySeconds) {
    if (!isPushSupported() || Notification.permission !== 'granted') return null;

    try {
        const subscription = await getPushSubscription();
        const response = await fetch('/api/schedule-rest-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscription: subscription.toJSON(),
                delaySeconds: Math.round(delaySeconds)
            })
        });
        if (!response.ok) return null;
        const data = await response.json().catch(() => null);
        return data?.messageId || null;
    } catch {
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
    } catch {
        // Melhor esforço.
    }
}
