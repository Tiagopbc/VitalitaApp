import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WorkoutsPage from './WorkoutsPage';
import { workoutService } from '../services/workoutService';

vi.mock('../services/workoutService', () => ({
    workoutService: {
        getTemplates: vi.fn(),
        saveTemplateOrder: vi.fn(),
        createTemplate: vi.fn()
    }
}));

vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>
    }
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
            assignedByTrainer: false,
            displayOrder: 0
        },
        {
            id: 'w2',
            name: 'Treino Costas',
            exercises: [],
            muscleGroups: ['Costas'],
            lastPerformed: { toDate: () => new Date('2024-01-01') },
            createdBy: 'trainer-1',
            assignedByTrainer: true,
            displayOrder: 1
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
            expect(screen.getByText('Treino Peito')).toBeInTheDocument();
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

        fireEvent.click(screen.getByRole('button', { name: 'Novo treino' }));
        expect(onNavigateToCreate).toHaveBeenCalledWith(null, { targetUserId: 'user123' });
    });

    it('shows how many workouts each source filter holds', async () => {
        await renderPage();

        // Todos 2 · Meus Treinos 1 · Personal Play 1 · Arquivados 0
        expect(screen.getByRole('button', { name: 'Todos' })).toHaveTextContent('2');
        expect(screen.getByRole('button', { name: 'Meus Treinos' })).toHaveTextContent('1');
        expect(screen.getByRole('button', { name: 'Arquivados' })).toHaveTextContent('0');
    });

    describe('duplicar treino', () => {
        const duplicate = async (workoutName) => {
            fireEvent.click(screen.getByRole('button', { name: `Abrir opções de ${workoutName}` }));
            fireEvent.click(screen.getByText('Duplicar'));
        };

        it('cria a cópia pelo workoutService, com nome numerado e grupos musculares', async () => {
            workoutService.createTemplate.mockResolvedValue('w1-copy');
            workoutService.saveTemplateOrder.mockResolvedValue(undefined);
            await renderPage();

            await duplicate('Treino Peito');

            await waitFor(() => {
                expect(workoutService.createTemplate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: 'Treino Peito (Cópia)',
                        targetUserId: 'user123',
                        createdBy: 'user123'
                    }),
                    expect.objectContaining({ muscleGroups: ['Peito'] })
                );
            });
        });

        // Sem o reposicionamento a cópia pulava para o topo da lista.
        it('posiciona a cópia logo abaixo do original', async () => {
            workoutService.createTemplate.mockResolvedValue('w1-copy');
            workoutService.saveTemplateOrder.mockResolvedValue(undefined);
            await renderPage();

            await duplicate('Treino Peito');

            await waitFor(() => {
                expect(workoutService.saveTemplateOrder).toHaveBeenCalledWith([
                    expect.objectContaining({ id: 'w1', displayOrder: 0 }),
                    expect.objectContaining({ id: 'w1-copy', displayOrder: 1 }),
                    expect.objectContaining({ id: 'w2', displayOrder: 2 })
                ]);
            });
        });

        // Cronológico: a segunda cópia entra depois da primeira, não em cima.
        it('empilha a cópia seguinte no fim do bloco de cópias', async () => {
            workoutService.createTemplate.mockResolvedValue('w1-copy');
            workoutService.saveTemplateOrder.mockResolvedValue(undefined);
            await renderPage();

            await duplicate('Treino Peito');
            await screen.findByText('Treino Peito (Cópia)');

            workoutService.createTemplate.mockResolvedValue('w1-copy-2');
            await duplicate('Treino Peito');

            await waitFor(() => {
                expect(workoutService.saveTemplateOrder).toHaveBeenLastCalledWith([
                    expect.objectContaining({ id: 'w1', displayOrder: 0 }),
                    expect.objectContaining({ id: 'w1-copy', displayOrder: 1 }),
                    expect.objectContaining({ id: 'w1-copy-2', displayOrder: 2 }),
                    expect.objectContaining({ id: 'w2', displayOrder: 3 })
                ]);
            });
        });

        it('marca a cópia com o selo CÓPIA e numera a duplicação seguinte', async () => {
            workoutService.createTemplate.mockResolvedValue('w1-copy');
            workoutService.saveTemplateOrder.mockResolvedValue(undefined);
            await renderPage();

            await duplicate('Treino Peito');

            expect(await screen.findByText('Treino Peito (Cópia)')).toBeInTheDocument();
            expect(screen.getAllByText('CÓPIA')).toHaveLength(1);

            workoutService.createTemplate.mockResolvedValue('w1-copy-2');
            await duplicate('Treino Peito');

            await waitFor(() => {
                expect(workoutService.createTemplate).toHaveBeenLastCalledWith(
                    expect.objectContaining({ name: 'Treino Peito (Cópia 2)' }),
                    expect.anything()
                );
            });
        });
    });

    it('lets the user move an active workout and persists the new order', async () => {
        workoutService.saveTemplateOrder.mockResolvedValue(undefined);
        await renderPage();

        fireEvent.click(screen.getByRole('button', { name: 'Ordem' }));
        fireEvent.click(screen.getByRole('button', { name: 'Mover Treino Peito para baixo' }));

        await waitFor(() => {
            expect(workoutService.saveTemplateOrder).toHaveBeenCalledWith([
                expect.objectContaining({ id: 'w2', displayOrder: 0 }),
                expect.objectContaining({ id: 'w1', displayOrder: 1 })
            ]);
        });
    });
});
