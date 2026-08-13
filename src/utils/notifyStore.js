/**
 * notifyStore.js
 * Estado dos avisos do app — a barra que desce do topo (`TopBanner`).
 *
 * É um módulo, e não um contexto React, por requisito e não por estilo:
 * `workoutService` e `HomeDashboard` emitem erro de fora da árvore React.
 * A API imperativa (`notify.success(...)`) é a mesma forma que o `sonner`
 * expunha, então os pontos de chamada não mudam de formato.
 */

export const AUTO_DISMISS_MS = 3000;

const listeners = new Set();

let current = null;
let nextId = 1;
let timerId = null;

function emit() {
    listeners.forEach(listener => listener());
}

function clearTimer() {
    if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
    }
}

function push(type, message, options = {}) {
    const action = options.action || null;

    // Aviso idêntico ao que já está na tela mantém o id: sem isso a barra
    // refaria a descida por cima dela mesma. Substitui a deduplicação por
    // `id` que o sonner fazia em useProfileData.
    if (current && current.type === type && current.message === message && !action && !current.action) {
        return current.id;
    }

    clearTimer();
    current = { id: nextId++, type, message, action };

    // Com ação, a barra espera toque — ver AUTO_DISMISS_MS no spec.
    if (!action) {
        timerId = setTimeout(() => {
            timerId = null;
            current = null;
            emit();
        }, AUTO_DISMISS_MS);
    }

    emit();
    return current.id;
}

export const notify = {
    success: (message, options) => push('success', message, options),
    error: (message, options) => push('error', message, options),
    info: (message, options) => push('info', message, options),
    dismiss: () => {
        clearTimer();
        if (current !== null) {
            current = null;
            emit();
        }
    }
};

export function subscribeToNotify(listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getNotifySnapshot() {
    return current;
}

/** Só para testes: zera o estado entre casos. */
export function resetNotifyStore() {
    clearTimer();
    current = null;
    nextId = 1;
}
