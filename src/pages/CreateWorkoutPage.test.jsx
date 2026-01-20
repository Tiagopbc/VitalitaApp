import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateWorkoutPage from './CreateWorkoutPage';
import React from 'react';
import { workoutService } from '../services/workoutService';
import { addDoc, updateDoc } from 'firebase/firestore';

// Mock dependencies
vi.mock('../services/workoutService', () => ({
    workoutService: {
        searchExercises: vi.fn()
    }
}));

vi.mock('../firebaseConfig', () => ({
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    doc: vi.fn(),
    serverTimestamp: vi.fn()
}));

// Mock Button component to simplify testing (avoiding complex styles/icons issues)
vi.mock('../components/design-system/Button', () => ({
    Button: ({ children, onClick, disabled, loading }) => (
        <button onClick={onClick} disabled={disabled || loading}>
            {children}
        </button>
    )
}));

describe('CreateWorkoutPage Integration', () => {
    const mockUser = { uid: 'user123' };
    const mockOnBack = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly and allows entering workout name', () => {
        render(<CreateWorkoutPage user={mockUser} onBack={mockOnBack} />);

        const nameInput = screen.getByPlaceholderText(/Ex: Treino A/i);
        fireEvent.change(nameInput, { target: { value: 'My New Workout' } });

        expect(nameInput.value).toBe('My New Workout');
    });

    it('opens add exercise modal and adds an exercise', async () => {
        render(<CreateWorkoutPage user={mockUser} onBack={mockOnBack} />);

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

    it('submits the workout to Firestore', async () => {
        addDoc.mockResolvedValue({ id: 'new-workout-id' });

        render(<CreateWorkoutPage user={mockUser} onBack={mockOnBack} />);

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
        expect(saveButton).toHaveTextContent('Salvando...'); // Loading state

        await waitFor(() => {
            expect(addDoc).toHaveBeenCalledTimes(1);
        });

        // Check payload
        const callArg = addDoc.mock.calls[0][1];
        expect(callArg).toMatchObject({
            name: 'Leg Day',
            userId: 'user123',
            createdBy: 'user123',
            exercises: expect.arrayContaining([
                expect.objectContaining({ name: 'Agachamento' })
            ])
        });

        // 5. Verify Redirect
        expect(mockOnBack).toHaveBeenCalled();
    });
});
