import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useExecutionNavigation } from './useExecutionNavigation';

// Timers que disparam depois de desmontar derrubam o CI de forma intermitente
// ("window is not defined" quando o jsdom já foi desmontado). Aqui o sintoma
// observável é o `window.scrollTo` chamado depois do unmount.

const exercises = [
    { id: 'a', sets: [{}, {}] },
    { id: 'b', sets: [{}, {}] }
];

function renderNavigation(props = {}) {
    return renderHook(() => useExecutionNavigation({
        exercises,
        focusMode: false,
        autoStartTimer: false,
        setShowTimer: vi.fn(),
        completeSetAutoFill: vi.fn(),
        ...props
    }));
}

describe('useExecutionNavigation — timers', () => {
    let scrollTo;

    beforeEach(() => {
        vi.useFakeTimers();
        scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
        const target = document.createElement('div');
        target.id = 'exercise-b';
        document.body.appendChild(target);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('rola até o próximo exercício 400 ms após concluir a última série', () => {
        const { result } = renderNavigation();

        act(() => result.current.handleCompleteSetWrapper('a', 2));
        expect(scrollTo).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(400));
        expect(scrollTo).toHaveBeenCalledTimes(1);
    });

    it('cancela o scroll pendente da conclusão de série ao desmontar', () => {
        const { result, unmount } = renderNavigation();

        act(() => result.current.handleCompleteSetWrapper('a', 2));
        unmount();
        vi.advanceTimersByTime(400);

        expect(scrollTo).not.toHaveBeenCalled();
    });

    it('cancela o segundo scroll do Modo Foco ao desmontar', () => {
        const { unmount } = renderNavigation({ focusMode: true });
        expect(scrollTo).toHaveBeenCalledTimes(1);

        unmount();
        vi.advanceTimersByTime(300);

        expect(scrollTo).toHaveBeenCalledTimes(1);
    });
});
