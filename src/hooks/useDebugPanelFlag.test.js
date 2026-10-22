import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebugPanelFlag } from './useDebugPanelFlag';

function setSearch(search) {
    window.history.replaceState({}, '', `/${search}`);
}

describe('useDebugPanelFlag', () => {
    beforeEach(() => {
        localStorage.clear();
        setSearch('');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('fica desligado sem o parâmetro', () => {
        const { result } = renderHook(() => useDebugPanelFlag('appcheck'));
        expect(result.current[0]).toBe(false);
    });

    it('liga com ?debug=<nome>', () => {
        setSearch('?debug=appcheck');
        const { result } = renderHook(() => useDebugPanelFlag('appcheck'));
        expect(result.current[0]).toBe(true);
    });

    it('ignora o parâmetro de outro painel', () => {
        setSearch('?debug=push');
        const { result } = renderHook(() => useDebugPanelFlag('appcheck'));
        expect(result.current[0]).toBe(false);
    });

    // O PWA instalado abre sem barra de endereço: sem persistir, não haveria
    // como reabrir o painel no aparelho.
    it('persiste depois que o parâmetro some da URL', () => {
        setSearch('?debug=appcheck');
        renderHook(() => useDebugPanelFlag('appcheck'));

        setSearch('');
        const { result } = renderHook(() => useDebugPanelFlag('appcheck'));
        expect(result.current[0]).toBe(true);
    });

    it('desliga com ?debug=off', () => {
        setSearch('?debug=appcheck');
        renderHook(() => useDebugPanelFlag('appcheck'));

        setSearch('?debug=off');
        const { result } = renderHook(() => useDebugPanelFlag('appcheck'));
        expect(result.current[0]).toBe(false);

        setSearch('');
        const depois = renderHook(() => useDebugPanelFlag('appcheck'));
        expect(depois.result.current[0]).toBe(false);
    });

    it('desliga pela função devolvida e não volta no próximo render', () => {
        setSearch('?debug=appcheck');
        const { result } = renderHook(() => useDebugPanelFlag('appcheck'));

        act(() => result.current[1]());
        expect(result.current[0]).toBe(false);

        setSearch('');
        const depois = renderHook(() => useDebugPanelFlag('appcheck'));
        expect(depois.result.current[0]).toBe(false);
    });

    it('não lança quando o localStorage falha', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('sem storage');
        });

        const { result } = renderHook(() => useDebugPanelFlag('appcheck'));
        expect(result.current[0]).toBe(false);
    });

    // O painel de push guardava a flag em `vitalita:pushDebug` antes de passar a
    // usar este hook. Quem estivesse com ele ligado perderia o painel — e no PWA
    // instalado não há barra de endereço para redigitar `?debug=push`, que é
    // justamente o motivo de a flag ser persistente.
    describe('chave legada do painel de push', () => {
        it('reconhece a flag antiga e mantém o painel ligado', () => {
            localStorage.setItem('vitalita:pushDebug', '1');
            const { result } = renderHook(() => useDebugPanelFlag('push'));
            expect(result.current[0]).toBe(true);
        });

        it('migra a flag antiga para a chave nova', () => {
            localStorage.setItem('vitalita:pushDebug', '1');
            renderHook(() => useDebugPanelFlag('push'));

            expect(localStorage.getItem('vitalita:debug:push')).toBe('1');
            expect(localStorage.getItem('vitalita:pushDebug')).toBeNull();
        });

        it('desligar limpa as duas chaves', () => {
            localStorage.setItem('vitalita:pushDebug', '1');
            const { result } = renderHook(() => useDebugPanelFlag('push'));
            act(() => result.current[1]());

            expect(result.current[0]).toBe(false);
            expect(localStorage.getItem('vitalita:debug:push')).toBeNull();
            expect(localStorage.getItem('vitalita:pushDebug')).toBeNull();
        });

        it('?debug=off apaga tambem a chave antiga', () => {
            localStorage.setItem('vitalita:pushDebug', '1');
            setSearch('?debug=off');
            const { result } = renderHook(() => useDebugPanelFlag('push'));

            expect(result.current[0]).toBe(false);
            expect(localStorage.getItem('vitalita:pushDebug')).toBeNull();
        });

        it('a migração vale só para o painel de push', () => {
            localStorage.setItem('vitalita:pushDebug', '1');
            const { result } = renderHook(() => useDebugPanelFlag('appcheck'));
            expect(result.current[0]).toBe(false);
        });
    });
});
