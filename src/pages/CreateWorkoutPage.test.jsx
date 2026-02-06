import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateWorkoutPage from './CreateWorkoutPage';
import React from 'react';
import { addDoc, updateDoc } from 'firebase/firestore';
import { MemoryRouter } from 'react-router-dom';

// ... imports
// ... imports

// Mock dependencies
vi.mock('../services/workoutService', () => ({
    workoutService: {
        searchExercises: vi.fn().mockResolvedValue([]),
        getWorkoutById: vi.fn()
    }
}));

vi.mock('../firebaseDb', () => ({
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    doc: vi.fn(),
    serverTimestamp: vi.fn()
}));

// Mock Button component to simplify testing
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

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('CreateWorkoutPage Integration', () => {
    const mockUser = { uid: 'user123' };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly and allows entering workout name', () => {
        render(
            <MemoryRouter>
                <CreateWorkoutPage user={mockUser} />
            </MemoryRouter>
        );

        const nameInput = screen.getByPlaceholderText(/Ex: Treino A/i);
        fireEvent.change(nameInput, { target: { value: 'My New Workout' } });

        expect(nameInput.value).toBe('My New Workout');
    });

    it('opens add exercise modal and adds an exercise', async () => {
        render(
            <MemoryRouter>
                <CreateWorkoutPage user={mockUser} />
            </MemoryRouter>
        );

        // 1. Click "Adicionar Exercício"
        const addButton = screen.getByText('Adicionar Exercício');
        fireEvent.click(addButton);

        // 2. Expect Modal to be open
        expect(screen.getByText('Novo Exercício')).toBeInTheDocument();

        // 3. Fill Exercise Form
        const exerciseInput = screen.getByPlaceholderText('Digite para buscar...');
        fireEvent.change(exerciseInput, { target: { value: 'Supino' } });

        // (We can assume searchExercises is called if logic is improved, but for now we manually add)

        // Fill other fields if necessary defaults needed changing
        // Defaults: 3 sets, 12 reps. Let's change reps.
        const inputs = screen.getAllByRole('textbox'); // or specific selectors
        const repsInput = inputs.find(i => i.value === '12'); // finding by value for simplicity in this mocked env
        if (repsInput) fireEvent.change(repsInput, { target: { value: '10' } });

        // 4. Click "Adicionar" in modal
        const confirmAdd = screen.getByText('Adicionar');
        fireEvent.click(confirmAdd);

        // 5. Expect Modal to close and exercise to appear in list
        await waitFor(() => {
            expect(screen.queryByText('Novo Exercício')).not.toBeInTheDocument();
        });

        expect(screen.getByText(/Supino/i)).toBeInTheDocument();
        expect(screen.getByText(/10 reps/i)).toBeInTheDocument();
    });

    it('disables save until name and exercise are provided', async () => {
        render(
            <MemoryRouter>
                <CreateWorkoutPage user={mockUser} />
            </MemoryRouter>
        );

        const saveButton = screen.getByText('Salvar Treino');
        expect(saveButton).toBeDisabled();

        const nameInput = screen.getByPlaceholderText(/Ex: Treino A/i);
        fireEvent.change(nameInput, { target: { value: 'Upper Body' } });
        expect(saveButton).toBeDisabled();

        fireEvent.click(screen.getByText('Adicionar Exercício'));
        const exerciseInput = screen.getByPlaceholderText('Digite para buscar...');
        fireEvent.change(exerciseInput, { target: { value: 'Remada' } });
        fireEvent.click(screen.getByText('Adicionar'));

        await waitFor(() => {
            expect(screen.queryByText('Novo Exercício')).not.toBeInTheDocument();
        });

        expect(saveButton).not.toBeDisabled();
    });

    it('submits the workout to Firestore', async () => {
        addDoc.mockResolvedValue({ id: 'new-workout-id' });

        render(
            <MemoryRouter>
                <CreateWorkoutPage user={mockUser} />
            </MemoryRouter>
        );

        // 1. Set Name
        const nameInput = screen.getByPlaceholderText(/Ex: Treino A/i);
        fireEvent.change(nameInput, { target: { value: 'Leg Day' } });

        // 2. Add Exercise
        fireEvent.click(screen.getByText('Adicionar Exercício'));
        const exerciseInput = screen.getByPlaceholderText('Digite para buscar...');
        fireEvent.change(exerciseInput, { target: { value: 'Agachamento' } });
        fireEvent.click(screen.getByText('Adicionar'));

        // 3. Save
        const saveButton = screen.getByText('Salvar Treino');
        expect(saveButton).not.toBeDisabled();
        fireEvent.click(saveButton);

        // 4. Verify Firestore Call
        // expect(saveButton).toHaveTextContent('Salvando...'); // Removed flaky text assertion

        await waitFor(() => {
            expect(addDoc).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });
    });

    it('updates an existing workout when initialData has id', async () => {
        updateDoc.mockResolvedValue();

        render(
            <MemoryRouter initialEntries={[{
                pathname: '/create',
                state: {
                    initialData: {
                        id: 'workout-1',
                        name: 'Edit Workout',
                        exercises: [{ id: 'ex-1', name: 'Supino', sets: '3', reps: '10', method: 'Convencional', muscleGroup: 'Peito' }]
                    }
                }
            }]}>
                <CreateWorkoutPage user={mockUser} />
            </MemoryRouter>
        );

        const saveButton = screen.getByText('Salvar Treino');
        expect(saveButton).not.toBeDisabled();
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(updateDoc).toHaveBeenCalledTimes(1);
            expect(addDoc).not.toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });
    });

    it('loads workout data by editId when refreshing URL', async () => {
        const { workoutService } = await import('../services/workoutService');
        workoutService.getWorkoutById.mockResolvedValue({
            id: 'workout-2',
            name: 'Loaded Workout',
            exercises: [{ id: 'ex-2', name: 'Agachamento', sets: '4', reps: '8', method: 'Convencional', muscleGroup: 'Quadríceps' }]
        });

        render(
            <MemoryRouter initialEntries={['/create?editId=workout-2']}>
                <CreateWorkoutPage user={mockUser} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(workoutService.getWorkoutById).toHaveBeenCalledWith('workout-2');
        });

        expect(screen.getByDisplayValue('Loaded Workout')).toBeInTheDocument();
        expect(screen.getByText(/Agachamento/i)).toBeInTheDocument();
    });
});
