import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    clearAppCheckLog,
    getAppCheckLog,
    getAppCheckStatus,
    recordAppCheckStatus
} from './appCheckDiagnostics';

describe('appCheckDiagnostics', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('grava o status da última verificação', () => {
        recordAppCheckStatus({ ok: false, code: 'appCheck/fetch-status-error', message: '403' });

        const status = getAppCheckStatus();
        expect(status.ok).toBe(false);
        expect(status.code).toBe('appCheck/fetch-status-error');
        expect(status.message).toBe('403');
        expect(status.checkedAt).toBeTruthy();
    });

    it('devolve null quando nunca houve verificação', () => {
        expect(getAppCheckStatus()).toBeNull();
        expect(getAppCheckLog()).toEqual([]);
    });

    // O log existe para mostrar falha; sucesso repetido a cada boot empurraria
    // a falha para fora das 20 posições.
    it('não registra no log quando o sucesso apenas se repete', () => {
        recordAppCheckStatus({ ok: true });
        recordAppCheckStatus({ ok: true });
        recordAppCheckStatus({ ok: true });

        expect(getAppCheckStatus().ok).toBe(true);
        expect(getAppCheckLog()).toEqual([]);
    });

    it('registra cada falha de código diferente', () => {
        recordAppCheckStatus({ ok: false, code: 'appCheck/throttled' });
        recordAppCheckStatus({ ok: false, code: 'appCheck/fetch-status-error' });

        const log = getAppCheckLog();
        expect(log).toHaveLength(2);
        expect(log.map(e => e.stage)).toEqual(['token:erro', 'token:erro']);
        expect(log[1].code).toBe('appCheck/fetch-status-error');
    });

    // O SDK repete a mesma falha a cada poucos segundos: sem agrupar, o começo
    // do problema seria empurrado para fora do log em dois minutos.
    it('agrupa repetições da mesma falha preservando o horário do início', () => {
        recordAppCheckStatus({ ok: false, code: 'appCheck/recaptcha-error' });
        const primeira = getAppCheckLog()[0].t;

        recordAppCheckStatus({ ok: false, code: 'appCheck/recaptcha-error' });
        recordAppCheckStatus({ ok: false, code: 'appCheck/recaptcha-error' });

        const log = getAppCheckLog();
        expect(log).toHaveLength(1);
        expect(log[0].repeticoes).toBe(3);
        expect(log[0].t).toBe(primeira);
        expect(log[0].ultimaT).toBeTruthy();
    });

    it('abre entrada nova quando o código da falha muda', () => {
        recordAppCheckStatus({ ok: false, code: 'appCheck/recaptcha-error' });
        recordAppCheckStatus({ ok: false, code: 'appCheck/recaptcha-error' });
        recordAppCheckStatus({ ok: false, code: 'appCheck/throttled' });

        const log = getAppCheckLog();
        expect(log).toHaveLength(2);
        expect(log[0].repeticoes).toBe(2);
        expect(log[1].code).toBe('appCheck/throttled');
    });

    it('registra a volta de falha para sucesso', () => {
        recordAppCheckStatus({ ok: false, code: 'appCheck/throttled' });
        recordAppCheckStatus({ ok: true });

        const log = getAppCheckLog();
        expect(log).toHaveLength(2);
        expect(log[1].stage).toBe('token:recuperado');

        // Recuperado uma vez, os sucessos seguintes voltam a ser silenciosos.
        recordAppCheckStatus({ ok: true });
        expect(getAppCheckLog()).toHaveLength(2);
    });

    it('mantém o log circular em 20 entradas', () => {
        for (let i = 0; i < 25; i += 1) {
            recordAppCheckStatus({ ok: false, code: `erro-${i}` });
        }

        const log = getAppCheckLog();
        expect(log).toHaveLength(20);
        expect(log[0].code).toBe('erro-5');
        expect(log[19].code).toBe('erro-24');
    });

    it('limpa o log sem apagar o status', () => {
        recordAppCheckStatus({ ok: false, code: 'appCheck/throttled' });
        clearAppCheckLog();

        expect(getAppCheckLog()).toEqual([]);
        expect(getAppCheckStatus().ok).toBe(false);
    });

    // Diagnóstico nunca pode quebrar o boot — nem em modo privado/quota cheia.
    it('não lança quando o localStorage falha', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('quota exceeded');
        });

        expect(() => recordAppCheckStatus({ ok: false, code: 'x' })).not.toThrow();
    });

    it('ignora conteúdo corrompido no storage', () => {
        localStorage.setItem('vitalita:appCheckLog', 'não é json');
        localStorage.setItem('vitalita:appCheckStatus', '{quebrado');

        expect(getAppCheckLog()).toEqual([]);
        expect(getAppCheckStatus()).toBeNull();
    });
});
