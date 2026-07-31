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

const mockFinishWorkout = vi.fn();

vi.mock('../context/WorkoutContext', () => ({
    useWorkout: () => ({ finishWorkout: mockFinishWorkout })
}));

vi.mock('../components/design-system/Button', () => ({
    Button: (props) => {
        const { children, onClick, disabled, loading, ...rest } = props;
        delete rest.leftIcon;
        delete rest.rightIcon;
        delete rest.variant;
        delete rest.size;
        delete rest.fullWidth;
        return (
            <button onClick={onClick} disabled={disabled || loading} {...rest}>
                {children}
            </button>
        );
    }
}));


vi.mock('../components/design-system/Toast', () => ({
    Toast: ({ message }) => <div>{message}</div>
}));

vi.mock('../components/design-system/Skeleton', () => ({
    Skeleton: () => <div>Skeleton</div>
}));

// O card é mockado, mas expõe o `groupRound` recebido: o que esta suíte
// verifica é a fiação (a página calcular e passar o resumo da volta). A
// renderização dos dois estados do aviso é coberta por GroupRoundNotice.test.
vi.mock('../components/execution/LinearCardCompactV2', () => ({
    LinearCardCompactV2: ({ groupRound }) => (
        <div>
            Card
            {groupRound && (
                <div data-testid="card-group-round">
                    {groupRound.label}|{groupRound.nextName}|{String(groupRound.roundNotStarted)}
                </div>
            )}
        </div>
    )
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

vi.mock('../services/userPreferencesService', () => ({
    userPreferencesService: {
        getWorkoutPreferences: vi.fn().mockResolvedValue({}),
        updateWorkoutPreferences: vi.fn().mockResolvedValue()
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

// Dois exercícios ligados por `groupId` mas com `method: 'Convencional'` — o
// caso real do botão de corrente e da importação por PDF, que definem só o
// agrupamento. É `groupId` (não `method`) que faz o Modo Foco alternar os
// exercícios e adiar o descanso, então o rótulo do grupo precisa aparecer
// mesmo com o método "Convencional".
const groupedExercises = [
    {
        id: 'ex-1',
        name: 'Supino',
        method: 'Convencional',
        groupId: 'grp_1',
        reps: '10',
        sets: [{ id: 's1', completed: false, reps: '10', weight: '40' }]
    },
    {
        id: 'ex-2',
        name: 'Crucifixo',
        method: 'Convencional',
        groupId: 'grp_1',
        reps: '12',
        sets: [{ id: 's2', completed: false, reps: '12', weight: '20' }]
    }
];

describe('WorkoutExecutionPage', () => {
    let baseReturn;
    beforeEach(() => {
        vi.clearAllMocks();
        mockFinishWorkout.mockClear();
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
        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar treino' }));
        expect(screen.getByText('Cancelar Treino?')).toBeInTheDocument();

        const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
        await act(async () => {
            fireEvent.click(confirmButton);
            await Promise.resolve();
        });

        expect(baseReturn.discardSession).toHaveBeenCalled();
        expect(mockFinishWorkout).toHaveBeenCalled();
    });

    it('moves cancel and sync status into FocusModeNav when focus mode is on', () => {
        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'FOCO' }));

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar treino' }));
        expect(screen.getByText('Cancelar Treino?')).toBeInTheDocument();
    });

    it('shows the group label in focus mode for a grouped exercise whose method is Convencional', () => {
        useWorkoutSession.mockReturnValue({ ...baseReturn, exercises: groupedExercises });
        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'FOCO' }));

        // `groupId` — não `method` — é o que faz o Modo Foco alternar os
        // exercícios; sem este rótulo o usuário não teria como saber disso.
        // O texto descreve o comportamento, não o nome do método, para não
        // repetir a tag "Bi-set" que o card já mostra.
        expect(screen.getByText('Alterna em dupla')).toBeInTheDocument();
    });

    it('omits the group label in focus mode for an ungrouped exercise', () => {
        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'FOCO' }));

        expect(screen.queryByText(/Alterna/i)).not.toBeInTheDocument();
    });

    it('omits the group label when the card method tag already describes the grouping', () => {
        // Caminho da importação por PDF: define `groupId` e `method: "Bi-set"`.
        // O card já mostra a tag, então repetir no topo só polui.
        useWorkoutSession.mockReturnValue({
            ...baseReturn,
            exercises: groupedExercises.map(ex => ({ ...ex, method: 'Bi-set' }))
        });
        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'FOCO' }));

        expect(screen.queryByText(/Alterna/i)).not.toBeInTheDocument();
    });

    // No Modo Foco só um exercício aparece por vez, então nada revelaria que
    // concluir a série salta para o parceiro — que pode exigir outro
    // equipamento. Nomear o parceiro é a informação que faltava.
    it('passes the group round preview to the card in focus mode', () => {
        useWorkoutSession.mockReturnValue({ ...baseReturn, exercises: groupedExercises });
        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'FOCO' }));

        // `method` é "Convencional" nestes dados: o resumo vem do `groupId`.
        expect(screen.getByTestId('card-group-round')).toHaveTextContent('Bi-set|Crucifixo|true');
    });

    it('omits the group round preview for an ungrouped exercise', () => {
        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'FOCO' }));

        expect(screen.queryByTestId('card-group-round')).not.toBeInTheDocument();
    });

    it('marks the round as started once any member has a completed set', () => {
        const started = groupedExercises.map((ex, i) =>
            i === 0 ? { ...ex, sets: [{ ...ex.sets[0], completed: true }] } : ex
        );
        useWorkoutSession.mockReturnValue({ ...baseReturn, exercises: started });
        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'FOCO' }));

        expect(screen.getByTestId('card-group-round')).toHaveTextContent('Bi-set|Crucifixo|false');
    });

    // A lista mostra os exercícios do grupo juntos na moldura do
    // ExerciseGroupCard — lá o aviso seria redundante.
    it('does not pass the group round preview outside focus mode', () => {
        useWorkoutSession.mockReturnValue({ ...baseReturn, exercises: groupedExercises });
        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        expect(screen.queryByTestId('card-group-round')).not.toBeInTheDocument();
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

    it('keeps the bottom padding compact in both modes', () => {
        render(<WorkoutExecutionPage user={{ uid: 'u1' }} />);

        const page = screen.getByTestId('workout-execution-page');
        const footer = screen.getByTestId('workout-finish-footer');
        expect(page).toHaveAttribute('data-focus-mode', 'false');
        expect(page).toHaveClass('pb-4');
        expect(footer.className).not.toContain('6rem');

        fireEvent.click(screen.getByRole('button', { name: 'FOCO' }));

        expect(page).toHaveAttribute('data-focus-mode', 'true');
        expect(page).not.toHaveClass('pb-4');
    });
});
