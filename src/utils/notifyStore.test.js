import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    notify,
    subscribeToNotify,
    getNotifySnapshot,
    resetNotifyStore,
    AUTO_DISMISS_MS
} from './notifyStore';

describe('notifyStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetNotifyStore();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('guarda o aviso e notifica quem assinou', () => {
        const listener = vi.fn();
        subscribeToNotify(listener);

        notify.success('Treino salvo.');

        expect(listener).toHaveBeenCalled();
        expect(getNotifySnapshot()).toMatchObject({ type: 'success', message: 'Treino salvo.' });
    });

    it('cancela a assinatura', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeToNotify(listener);
        unsubscribe();

        notify.info('Qualquer coisa.');

        expect(listener).not.toHaveBeenCalled();
    });

    // Fila de um: empilhar barras full-bleed cobriria a tela.
    it('aviso novo substitui o anterior', () => {
        notify.success('Treino salvo.');
        notify.error('Erro ao salvar treino.');

        expect(getNotifySnapshot()).toMatchObject({ type: 'error', message: 'Erro ao salvar treino.' });
    });

    // O id é a chave de remount do componente: sem id novo, duas mensagens
    // em sequência trocariam o texto sem refazer a descida.
    it('gera id novo a cada aviso diferente', () => {
        const primeiro = notify.success('Treino salvo.');
        const segundo = notify.success('Treino duplicado.');

        expect(segundo).not.toBe(primeiro);
    });

    it('aviso idêntico ao que está na tela não gera id novo', () => {
        const primeiro = notify.error('Erro ao carregar treinos.');
        const repetido = notify.error('Erro ao carregar treinos.');

        expect(repetido).toBe(primeiro);
    });

    it('mesma mensagem em tipo diferente gera id novo', () => {
        const primeiro = notify.info('Pronto.');
        const segundo = notify.success('Pronto.');

        expect(segundo).not.toBe(primeiro);
    });

    it('some sozinho depois da duração', () => {
        notify.success('Treino salvo.');

        vi.advanceTimersByTime(AUTO_DISMISS_MS);

        expect(getNotifySnapshot()).toBeNull();
    });

    it('o relógio do aviso novo recomeça do zero', () => {
        notify.success('Treino salvo.');
        vi.advanceTimersByTime(AUTO_DISMISS_MS - 500);
        notify.success('Treino duplicado.');

        vi.advanceTimersByTime(AUTO_DISMISS_MS - 500);
        expect(getNotifySnapshot()).not.toBeNull();

        vi.advanceTimersByTime(500);
        expect(getNotifySnapshot()).toBeNull();
    });

    // Sumir em 3s levaria o botão embora antes de o usuário decidir.
    it('com ação, não some sozinho', () => {
        notify.error('Erro ao carregar dados.', {
            action: { label: 'Tentar Novamente', onClick: vi.fn() }
        });

        vi.advanceTimersByTime(AUTO_DISMISS_MS * 3);

        expect(getNotifySnapshot()).toMatchObject({ message: 'Erro ao carregar dados.' });
        expect(getNotifySnapshot().action.label).toBe('Tentar Novamente');
    });

    it('dismiss limpa na hora', () => {
        notify.success('Treino salvo.');

        notify.dismiss();

        expect(getNotifySnapshot()).toBeNull();
    });

    it('dismiss não deixa o timer antigo derrubar um aviso posterior', () => {
        const listener = vi.fn();
        subscribeToNotify(listener);

        // Timer 1 dispararia em AUTO_DISMISS_MS
        notify.success('Treino salvo.');
        expect(listener).toHaveBeenCalledTimes(1);

        // Avançar até perto do disparo
        vi.advanceTimersByTime(AUTO_DISMISS_MS - 500);

        // Descartar: deve limpar o timer 1
        notify.dismiss();
        expect(listener).toHaveBeenCalledTimes(2);

        // Avançar 500ms: passa o ponto onde Timer 1 teria disparado
        // Se dismiss() limpou corretamente, Timer 1 NÃO dispara
        // Se dismiss() não limpou, Timer 1 dispara e chama listener
        vi.advanceTimersByTime(500);

        // Se dismiss() limpou corretamente, ainda em 2 chamadas
        // Se dismiss() não limpou, será 3 (Timer 1 dispara)
        expect(listener).toHaveBeenCalledTimes(2);

        // Agora criar novo aviso
        notify.info('Outro aviso.');
        expect(listener).toHaveBeenCalledTimes(3);

        // Timer 2 deve estar de pé
        expect(getNotifySnapshot()).toMatchObject({ message: 'Outro aviso.' });

        // Avançar para Timer 2 disparar
        vi.advanceTimersByTime(AUTO_DISMISS_MS);

        // Timer 2 dispara e chama listener
        expect(listener).toHaveBeenCalledTimes(4);
        expect(getNotifySnapshot()).toBeNull();
    });
});
