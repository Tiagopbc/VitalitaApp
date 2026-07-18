/**
 * useWakeLock.js
 * Mantém a tela ligada (Screen Wake Lock API) enquanto `active` for verdadeiro.
 * Readquire o lock ao voltar do segundo plano; libera ao desativar/desmontar.
 * Melhoria progressiva: navegadores sem suporte seguem funcionando normalmente.
 */
import { useEffect } from 'react';

export function useWakeLock(active) {
    useEffect(() => {
        if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
            return undefined;
        }

        let lock = null;
        let cancelled = false;

        const request = async () => {
            try {
                lock = await navigator.wakeLock.request('screen');
                if (cancelled) {
                    lock.release().catch(() => undefined);
                }
            } catch {
                // Pode falhar em modo economia de bateria — comportamento aceitável.
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !cancelled) {
                request();
            }
        };

        request();
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onVisibilityChange);
            if (lock) {
                lock.release().catch(() => undefined);
            }
        };
    }, [active]);
}
