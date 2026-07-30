import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutionTopBar } from './ExecutionTopBar';

describe('ExecutionTopBar', () => {
    const baseProps = {
        onBack: vi.fn(),
        onDiscard: vi.fn(),
        onOpenGymTools: vi.fn(),
        showGymTools: false,
        showTimer: false,
        onToggleTimer: vi.fn(),
        focusMode: false,
        onToggleFocus: vi.fn()
    };

    it('shows the Cancelar treino button outside focus mode', () => {
        render(<ExecutionTopBar {...baseProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar treino' }));
        expect(baseProps.onDiscard).toHaveBeenCalledTimes(1);
    });

    it('hides the Cancelar treino button in focus mode', () => {
        render(<ExecutionTopBar {...baseProps} focusMode />);
        expect(screen.queryByRole('button', { name: 'Cancelar treino' })).not.toBeInTheDocument();
    });
});
