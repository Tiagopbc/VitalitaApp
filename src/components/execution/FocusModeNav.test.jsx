import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusModeNav } from './FocusModeNav';
import { SESSION_SYNC_STATES } from '../../services/sessions/sessionRecoveryService';

describe('FocusModeNav', () => {
    const baseProps = {
        currentExerciseIndex: 1,
        totalExercises: 3,
        onPrev: vi.fn(),
        onNext: vi.fn(),
        onDiscard: vi.fn(),
        syncStatus: SESSION_SYNC_STATES.saved
    };

    it('shows the current position', () => {
        render(<FocusModeNav {...baseProps} />);
        expect(screen.getByText('2 de 3')).toBeInTheDocument();
    });

    it('omits the group badge for an ungrouped exercise', () => {
        render(<FocusModeNav {...baseProps} groupLabel={null} />);
        expect(screen.queryByText(/Alterna/i)).not.toBeInTheDocument();
    });

    it('shows the group badge when the exercise belongs to a group', () => {
        render(<FocusModeNav {...baseProps} groupLabel="Alterna em dupla" />);
        expect(screen.getByText('Alterna em dupla')).toBeInTheDocument();
    });

    it('disables Anterior on the first exercise', () => {
        render(<FocusModeNav {...baseProps} currentExerciseIndex={0} />);
        expect(screen.getByRole('button', { name: /Anterior/i })).toBeDisabled();
    });

    it('disables Próximo on the last exercise', () => {
        render(<FocusModeNav {...baseProps} currentExerciseIndex={2} />);
        expect(screen.getByRole('button', { name: /Próximo/i })).toBeDisabled();
    });

    it('calls onDiscard when Cancelar treino is clicked', () => {
        render(<FocusModeNav {...baseProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar treino' }));
        expect(baseProps.onDiscard).toHaveBeenCalledTimes(1);
    });

    it('shows the sync status label', () => {
        render(<FocusModeNav {...baseProps} syncStatus={SESSION_SYNC_STATES.saved} />);
        expect(screen.getByText('Salvo agora')).toBeInTheDocument();
    });
});
