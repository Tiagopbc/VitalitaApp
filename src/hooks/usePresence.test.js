import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePresence } from './usePresence';

// Substitui o AnimatePresence do framer-motion: mantém o elemento montado
// durante a animação de saída e só então desmonta.
describe('usePresence', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('aberto desde o início: montado e sem saída', () => {
        const { result } = renderHook(() => usePresence(true, 200));
        expect(result.current).toEqual({ mounted: true, leaving: false });
    });

    it('fechado desde o início: não monta', () => {
        const { result } = renderHook(() => usePresence(false, 200));
        expect(result.current).toEqual({ mounted: false, leaving: false });
    });

    it('ao fechar, fica montado em saída pelo tempo da animação e depois desmonta', () => {
        const { result, rerender } = renderHook(({ open }) => usePresence(open, 200), { initialProps: { open: true } });
        rerender({ open: false });
        expect(result.current).toEqual({ mounted: true, leaving: true });

        act(() => { vi.advanceTimersByTime(199); });
        expect(result.current.mounted).toBe(true);

        act(() => { vi.advanceTimersByTime(1); });
        expect(result.current).toEqual({ mounted: false, leaving: false });
    });

    it('reabrir durante a saída cancela a desmontagem', () => {
        const { result, rerender } = renderHook(({ open }) => usePresence(open, 200), { initialProps: { open: true } });
        rerender({ open: false });
        act(() => { vi.advanceTimersByTime(100); });
        rerender({ open: true });
        act(() => { vi.advanceTimersByTime(500); });
        expect(result.current).toEqual({ mounted: true, leaving: false });
    });

    it('abrir depois de fechado monta de novo', () => {
        const { result, rerender } = renderHook(({ open }) => usePresence(open, 200), { initialProps: { open: false } });
        rerender({ open: true });
        expect(result.current).toEqual({ mounted: true, leaving: false });
    });
});
