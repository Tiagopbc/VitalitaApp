/**
 * appCheckDiagnostics.js
 * Estado e log leve do token do App Check, para diagnosticar em produção — onde
 * o Sentry é desligado por decisão (ver docs/observability.md) e um PWA de
 * iPhone não tem console à mão.
 *
 * Existe por causa do incidente de 21/07 a 07/08/2026: a troca do token
 * devolvia 403 e o SDK só emitia um `console.warn`, então a quebra passou duas
 * semanas despercebida. Ver MANUAL_TECNICO.md §7.3.
 *
 * Tudo aqui é "melhor esforço" e nunca pode lançar: diagnóstico jamais deve
 * quebrar o boot do app. Roda apenas no contexto da janela (usa localStorage).
 */

const STATUS_KEY = 'vitalita:appCheckStatus';
const LOG_KEY = 'vitalita:appCheckLog';
const MAX_ENTRIES = 20;

function hasStorage() {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function safeParse(raw, fallback) {
    try {
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

/** Estado da última verificação, ou `null` se nunca houve uma. */
export function getAppCheckStatus() {
    if (!hasStorage()) return null;
    try {
        const raw = localStorage.getItem(STATUS_KEY);
        return raw ? safeParse(raw, null) : null;
    } catch {
        return null;
    }
}

/** Eventos registrados (mais antigo → mais recente). */
export function getAppCheckLog() {
    if (!hasStorage()) return [];
    try {
        const parsed = safeParse(localStorage.getItem(LOG_KEY), []);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function clearAppCheckLog() {
    if (!hasStorage()) return;
    try {
        localStorage.removeItem(LOG_KEY);
    } catch {
        // Sem storage (modo privado/quota): diagnóstico é opcional.
    }
}

/**
 * Grava o resultado da verificação do token.
 *
 * O status é sobrescrito a cada boot, mas o log só recebe entrada quando algo
 * muda de figura: uma falha, ou a volta de falha para sucesso. Registrar todo
 * sucesso encheria as 20 posições em poucos dias de uso e empurraria para fora
 * justamente a falha que se quer enxergar.
 *
 * @param {{ ok: boolean, code?: string, message?: string }} result
 */
export function recordAppCheckStatus({ ok, code, message } = {}) {
    if (!hasStorage()) return;

    try {
        const previous = getAppCheckStatus();
        const status = {
            ok: Boolean(ok),
            code: code || null,
            message: message || null,
            checkedAt: new Date().toISOString()
        };

        localStorage.setItem(STATUS_KEY, JSON.stringify(status));

        const recuperou = status.ok && previous && previous.ok === false;
        if (status.ok && !recuperou) return;

        const stage = status.ok ? 'token:recuperado' : 'token:erro';
        const log = getAppCheckLog();
        const ultima = log[log.length - 1];

        // O SDK repete a mesma falha a cada poucos segundos. Sem agrupar,
        // 20 entradas idênticas se acumulam em dois minutos e empurram para
        // fora o começo do problema — que é a informação que interessa.
        if (ultima && ultima.stage === stage && ultima.code === status.code) {
            ultima.repeticoes = (ultima.repeticoes || 1) + 1;
            ultima.ultimaT = status.checkedAt;
        } else {
            log.push({
                t: status.checkedAt,
                stage,
                code: status.code,
                message: status.message,
                repeticoes: 1
            });
        }

        while (log.length > MAX_ENTRIES) log.shift();
        localStorage.setItem(LOG_KEY, JSON.stringify(log));
    } catch {
        // Sem storage (modo privado/quota): diagnóstico é opcional.
    }
}
