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
    // `null`, não `undefined`: mantém a forma do snapshot estável mesmo
    // quando ninguém passa description (ver Tarefa 5a).
    const description = options.description ?? null;
    const duration = options.duration;

    // Aviso idêntico ao que já está na tela mantém o id: sem isso a barra
    // refaria a descida por cima dela mesma. Substitui a deduplicação por
    // `id` que o sonner fazia em useProfileData. Leva a description em
    // conta: mesma mensagem com explicação diferente é um aviso diferente.
    if (
        current &&
        current.type === type &&
        current.message === message &&
        current.description === description &&
        !action &&
        !current.action
    ) {
        return current.id;
    }

    clearTimer();
    current = { id: nextId++, type, message, description, action };

    // `duration` explícito manda mesmo com ação — é o caso do aviso de
    // bi-set em CreateWorkoutPage, que tem botão e ainda assim some em 8s.
    // Sem `duration`: some em AUTO_DISMISS_MS se não há ação, ou espera o
    // toque se há (como antes desta emenda).
    const dismissDelay = duration ?? (action ? null : AUTO_DISMISS_MS);
    if (dismissDelay !== null) {
        timerId = setTimeout(() => {
            timerId = null;
            current = null;
            emit();
        }, dismissDelay);
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
