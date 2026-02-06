import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkoutExecutionPage } from './WorkoutExecutionPage';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';
import { checkNewAchievements } from '../utils/evaluateAchievements';

vi.mock('../hooks/useWorkoutSession', () => ({
    useWorkoutSession: vi.fn()
}));

vi.mock('../hooks/useWorkoutTimer', () => ({
    useWorkoutTimer: vi.fn()
}));

vi.mock('../context/WorkoutContext', () => ({
    useWorkout: () => ({ finishWorkout: vi.fn() })
}));

vi.mock('../components/design-system/Button', () => ({
    Button: ({ children, onClick, disabled, ...props }) => (
        <button onClick={onClick} disabled={disabled} {...props}>
            {children}
        </button>
    )
}));

vi.mock('../components/design-system/RippleButton', () => ({
    RippleButton: ({ children, onClick, ...props }) => (
        <button onClick={onClick} {...props}>
            {children}
        </button>
    )
}));

vi.mock('../components/design-system/Toast', () => ({
    Toast: ({ message }) => <div>{message}</div>
}));

vi.mock('../components/design-system/Skeleton', () => ({
    Skeleton: () => <div>Skeleton</div>
}));

vi.mock('../components/execution/LinearCardCompactV2', () => ({
    LinearCardCompactV2: () => <div>Card</div>
}));

vi.mock('../components/execution/RestTimer', () => ({
    RestTimer: () => <div>Timer</div>
}));

vi.mock('../MethodModal', () => ({
    default: () => <div>MethodModal</div>
}));

vi.mock('../components/achievements/AchievementUnlockedModal', () => ({
    AchievementUnlockedModal: () => <div>AchievementModal</div>
}));

vi.mock('../components/sharing/ShareableWorkoutCard', () => ({
    ShareableWorkoutCard: () => <div>ShareCard</div>
}));

vi.mock('canvas-confetti', () => ({
    default: vi.fn()
}));

vi.mock('html-to-image', () => ({
    toPng: vi.fn().mockResolvedValue('data:image/png;base64,AAA')
}));

vi.mock('../utils/evaluateAchievements', () => ({
    checkNewAchievements: vi.fn()
}));

vi.mock('../services/userService', () => ({
    userService: {
        getUserProfile: vi.fn().mockResolvedValue({}),
        updateUserProfile: vi.fn().mockResolvedValue()
    }
}));

const baseExercises = [
    {
        id: 'ex-1',
        name: 'Supino',
        method: 'Convencional',
        reps: '10',
        sets: [{ id: 's1', completed: false, reps: '10', weight: '40' }]
    }
];

describe('WorkoutExecutionPage', () => {
    let baseReturn;
    beforeEach(() => {
        vi.clearAllMocks();
        useWorkoutTimer.mockReturnValue({
            elapsedSeconds: 0,
            setElapsedSeconds: vi.fn()
        });
        baseReturn = {
            loading: false,
            saving: false,
            error: null,
            setError: vi.fn(),
            template: { name: 'Treino A' },
            exercises: baseExercises,
            initialElapsed: 0,
            updateExerciseSet: vi.fn(),
            updateNotes: vi.fn(),
            completeSetAutoFill: vi.fn(),
            finishSession: vi.fn().mockResolvedValue(true),
            syncSession: vi.fn(),
            discardSession: vi.fn().mockResolvedValue(),
            updateSetMultiple: vi.fn(),
            toggleExerciseWeightMode: vi.fn()
        };
        useWorkoutSession.mockReturnValue(baseReturn);
        checkNewAchievements.mockResolvedValue([]);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('opens cancel modal and confirms discard', async () => {
        const originalLocation = window.location;
        delete window.location;
        window.location = { href: '' };

        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'CANCELAR' }));
        expect(screen.getByText('Cancelar Treino?')).toBeInTheDocument();

        const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
        await act(async () => {
            fireEvent.click(confirmButton);
            await Promise.resolve();
        });

        expect(baseReturn.discardSession).toHaveBeenCalled();
        expect(window.location.href).toBe('/');

        window.location = originalLocation;
    });

    it('finishes workout and shows finish modal', async () => {
        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        fireEvent.click(screen.getByRole('button', { name: /FINALIZAR TREINO/i }));
        expect(screen.getByText('Finalizar Treino?')).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
        });

        await act(async () => {
            await Promise.resolve();
        });
        expect(baseReturn.finishSession).toHaveBeenCalled();

        expect(await screen.findByText('Compartilhar Resultado', {}, { timeout: 2000 })).toBeInTheDocument();
    });
});
