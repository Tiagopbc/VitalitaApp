import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WorkoutsPage from './WorkoutsPage';
import { workoutService } from '../services/workoutService';

vi.mock('../services/workoutService', () => ({
    workoutService: {
        getTemplates: vi.fn()
    }
}));

vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>
    }
}));

vi.mock('../components/design-system/RippleButton', () => ({
    RippleButton: ({ children, onClick, ...props }) => (
        <button onClick={onClick} {...props}>
            {children}
        </button>
    )
}));

vi.mock('../components/design-system/PremiumCard', () => ({
    PremiumCard: ({ children, onClick, ...props }) => (
        <div onClick={onClick} {...props}>
            {children}
        </div>
    )
}));

vi.mock('../components/workout/ExerciseCard', () => ({
    ExerciseCard: ({ name }) => <div>{name}</div>
}));

vi.mock('../components/workout/EditExerciseModal', () => ({
    EditExerciseModal: () => <div>Editar Exercício</div>
}));

describe('WorkoutsPage', () => {
    const mockUser = { uid: 'user123' };
    const workoutsData = [
        {
            id: 'w1',
            name: 'Treino Peito',
            exercises: [{ name: 'Supino' }],
            muscleGroups: ['Peito'],
            lastPerformed: { toDate: () => new Date('2024-01-02') },
            createdBy: 'user123',
            assignedByTrainer: false
        },
        {
            id: 'w2',
            name: 'Treino Costas',
            exercises: [],
            muscleGroups: ['Costas'],
            lastPerformed: { toDate: () => new Date('2024-01-01') },
            createdBy: 'trainer-1',
            assignedByTrainer: true
        }
    ];

    const renderPage = async (props = {}) => {
        const onNavigateToCreate = vi.fn();
        const onNavigateToWorkout = vi.fn();

        workoutService.getTemplates.mockResolvedValue(workoutsData);

        render(
            <WorkoutsPage
                user={mockUser}
                onNavigateToCreate={onNavigateToCreate}
                onNavigateToWorkout={onNavigateToWorkout}
                {...props}
            />
        );

        await waitFor(() => {
            expect(workoutService.getTemplates).toHaveBeenCalledWith('user123');
        });

        return { onNavigateToCreate, onNavigateToWorkout };
    };

    it('renders workouts and filters by search', async () => {
        await renderPage();

        expect(screen.getByText('Treino Peito')).toBeInTheDocument();
        expect(screen.getByText('Treino Costas')).toBeInTheDocument();

        const searchInput = screen.getByPlaceholderText('Buscar por nome ou músculo...');
        fireEvent.change(searchInput, { target: { value: 'costas' } });

        expect(screen.queryByText('Treino Peito')).not.toBeInTheDocument();
        expect(screen.getByText('Treino Costas')).toBeInTheDocument();
    });

    it('filters workouts by source tabs', async () => {
        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: 'Meus Treinos' }));
        expect(screen.getByText('Treino Peito')).toBeInTheDocument();
        expect(screen.queryByText('Treino Costas')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Personal Play' }));
        expect(screen.getByText('Treino Costas')).toBeInTheDocument();
        expect(screen.queryByText('Treino Peito')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Todos' }));
        expect(screen.getByText('Treino Peito')).toBeInTheDocument();
        expect(screen.getByText('Treino Costas')).toBeInTheDocument();
    });

    it('calls onNavigateToWorkout when clicking INICIAR', async () => {
        const { onNavigateToWorkout } = await renderPage();

        const startButtons = screen.getAllByText('INICIAR');
        fireEvent.click(startButtons[0]);

        expect(onNavigateToWorkout).toHaveBeenCalledWith('w1', 'Treino Peito');
    });

    it('calls onNavigateToCreate when clicking Novo Treino', async () => {
        const { onNavigateToCreate } = await renderPage();

        fireEvent.click(screen.getByText('Novo Treino'));
        expect(onNavigateToCreate).toHaveBeenCalledWith(null, { targetUserId: 'user123' });
    });
});
