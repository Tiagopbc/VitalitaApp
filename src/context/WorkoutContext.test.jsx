
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { WorkoutProvider, useWorkout } from './WorkoutContext';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// --- MOCKS ---

// Mock Firebase
const mockOnSnapshot = vi.fn();
const mockGetDoc = vi.fn();
const mockDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
    doc: (...args) => mockDoc(...args),
    getDoc: (...args) => mockGetDoc(...args),
    onSnapshot: (...args) => mockOnSnapshot(...args),
}));

vi.mock('../firebaseConfig', () => ({
    db: {}
}));

// Mock Services
// FIX: Define mock inside the factory or use doMock, but simpler to just return object here
const mockSetActiveWorkout = vi.fn();
const mockClearActiveWorkout = vi.fn();

vi.mock('../services/userService', () => ({
    userService: {
        setActiveWorkout: (...args) => mockSetActiveWorkout(...args),
        clearActiveWorkout: (...args) => mockClearActiveWorkout(...args)
    }
}));

// Mock Auth Context
vi.mock('../AuthContext', () => ({
    useAuth: () => ({ user: { uid: 'user123', displayName: 'Test User' } })
}));

// Mock Router Navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});


// --- HELPER COMPONENT ---
function TestComponent() {
    const { activeWorkoutId, startWorkout, finishWorkout } = useWorkout();
    return (
        <div>
            <div data-testid="active-id">{activeWorkoutId || 'NONE'}</div>
            <button onClick={() => startWorkout('workout-123')}>Start</button>
            <button onClick={() => finishWorkout()}>Finish</button>
        </div>
    );
}

describe('WorkoutContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();

        // Default: onSnapshot returns an unsubscribe function
        mockOnSnapshot.mockReturnValue(() => { });
    });

    it('initializes with null activeWorkoutId', () => {
        render(
            <MemoryRouter>
                <WorkoutProvider>
                    <TestComponent />
                </WorkoutProvider>
            </MemoryRouter>
        );
        expect(screen.getByTestId('active-id')).toHaveTextContent('NONE');
    });

    it('startWorkout updates state and calls service', async () => {
        render(
            <MemoryRouter>
                <WorkoutProvider>
                    <TestComponent />
                </WorkoutProvider>
            </MemoryRouter>
        );

        const btn = screen.getByText('Start');
        await act(async () => {
            btn.click();
        });

        expect(screen.getByTestId('active-id')).toHaveTextContent('workout-123');
        expect(mockSetActiveWorkout).toHaveBeenCalledWith('user123', 'workout-123');
        expect(mockNavigate).toHaveBeenCalledWith('/execute/workout-123');
        expect(localStorage.getItem('activeWorkoutId')).toBe('workout-123');
    });

    it('finishWorkout clears state and navigates home', async () => {
        // Setup initial state
        localStorage.setItem('activeWorkoutId', 'existing-id');

        render(
            <MemoryRouter>
                <WorkoutProvider>
                    <TestComponent />
                </WorkoutProvider>
            </MemoryRouter>
        );

        // Should start with existing
        expect(screen.getByTestId('active-id')).toHaveTextContent('existing-id');

        const btn = screen.getByText('Finish');
        await act(async () => {
            btn.click();
        });

        expect(screen.getByTestId('active-id')).toHaveTextContent('NONE');
        expect(mockNavigate).toHaveBeenCalledWith('/');
        expect(localStorage.getItem('activeWorkoutId')).toBeNull();
    });

    // TODO: Add complex test for Remote Sync using onSnapshot mock implementation
});
