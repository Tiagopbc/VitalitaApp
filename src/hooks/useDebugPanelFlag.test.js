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
});
