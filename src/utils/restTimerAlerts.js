/**
 * restTimerAlerts.js
 * Alertas do fim do descanso: som (WebAudio), vibração e notificação do sistema
 * para quando o app está em segundo plano ou a tela está bloqueada.
 *
 * Limitação conhecida: com a tela bloqueada o JS pode ser suspenso pelo sistema;
 * nesse caso a notificação dispara assim que o dispositivo/aba volta a ativar.
 */

let audioContext = null;

/**
 * Prepara o contexto de áudio. Deve ser chamado a partir de um gesto do usuário
 * (abrir/iniciar o timer), senão o navegador bloqueia a reprodução.
 */
export function primeRestAudio() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        if (!audioContext) {
            audioContext = new Ctx();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => undefined);
        }
    } catch {
        audioContext = null;
    }
}

/**
 * Três bipes curtos ascendentes ao fim do descanso.
 */
export function playRestCompleteSound() {
    if (!audioContext || audioContext.state !== 'running') return;
    try {
        const now = audioContext.currentTime;
        [660, 880, 1100].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = now + i * 0.22;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.start(start);
            osc.stop(start + 0.2);
        });
    } catch {
        // Som é melhoria progressiva; falha não deve interromper o timer.
    }
}

/**
 * Pede permissão de notificação se ainda não decidida. Retorna se está concedida.
 */
export async function ensureNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    try {
        return (await Notification.requestPermission()) === 'granted';
    } catch {
        return false;
    }
}

/**
 * Notificação de descanso concluído. Prefere o service worker (necessário no
 * Android/PWA); cai para o construtor Notification em desktop.
 */
export async function notifyRestComplete() {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const title = 'Vitalità';
    const options = {
        body: 'Descanso concluído. Hora da próxima série! 💪',
        tag: 'vitalita-rest-timer',
        renotify: true,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200, 100, 200]
    };

    try {
        const registration = await navigator.serviceWorker?.getRegistration();
        if (registration?.showNotification) {
            await registration.showNotification(title, options);
            return;
        }
    } catch {
        // Sem service worker disponível — tenta o construtor direto abaixo.
    }

    try {
        new Notification(title, options);
    } catch {
        // Alguns ambientes (Android sem SW) lançam aqui; nada a fazer.
    }
}
