
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
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

vi.mock('../firebaseDb', () => ({
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
    let snapshotCallback;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        snapshotCallback = undefined;

        // Default: capture callback and return unsubscribe
        mockOnSnapshot.mockImplementation((_ref, cb) => {
            snapshotCallback = cb;
            return () => { };
        });
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

    it('syncs remote active session and navigates when session exists', async () => {
        window.history.pushState({}, '', '/');
        mockGetDoc.mockResolvedValueOnce({ exists: () => true });

        render(
            <MemoryRouter>
                <WorkoutProvider>
                    <TestComponent />
                </WorkoutProvider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(snapshotCallback).toBeTypeOf('function');
        });

        await act(async () => {
            await snapshotCallback({
                exists: () => true,
                data: () => ({ activeWorkoutId: 'remote-123' })
            });
        });

        expect(screen.getByTestId('active-id')).toHaveTextContent('remote-123');
        expect(localStorage.getItem('activeWorkoutId')).toBe('remote-123');
        expect(mockNavigate).toHaveBeenCalledWith('/execute/remote-123');
    });

    it('clears ghost session when remote active workout does not exist', async () => {
        window.history.pushState({}, '', '/');
        mockGetDoc.mockResolvedValueOnce({ exists: () => false });

        render(
            <MemoryRouter>
                <WorkoutProvider>
                    <TestComponent />
                </WorkoutProvider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(snapshotCallback).toBeTypeOf('function');
        });

        await act(async () => {
            await snapshotCallback({
                exists: () => true,
                data: () => ({ activeWorkoutId: 'ghost-1' })
            });
        });

        expect(mockClearActiveWorkout).toHaveBeenCalledWith('user123');
        expect(screen.getByTestId('active-id')).toHaveTextContent('NONE');
        expect(localStorage.getItem('activeWorkoutId')).toBeNull();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('clears manual exit flags even if remote clear fails', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        window.history.pushState({}, '', '/');
        sessionStorage.setItem('manual_exit', '1');
        mockClearActiveWorkout.mockRejectedValueOnce(new Error('fail'));

        try {
            render(
                <MemoryRouter>
                    <WorkoutProvider>
                        <TestComponent />
                    </WorkoutProvider>
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(snapshotCallback).toBeTypeOf('function');
            });

            await act(async () => {
                await snapshotCallback({
                    exists: () => true,
                    data: () => ({ activeWorkoutId: 'remote-err' })
                });
            });

            expect(mockClearActiveWorkout).toHaveBeenCalledWith('user123');
            expect(sessionStorage.getItem('manual_exit')).toBeNull();
            expect(localStorage.getItem('activeWorkoutId')).toBeNull();
            expect(screen.getByTestId('active-id')).toHaveTextContent('NONE');
            expect(mockNavigate).not.toHaveBeenCalled();
        } finally {
            consoleSpy.mockRestore();
        }
    });
});
