import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import React from 'react';

// --- Mocks ---

// Mock AuthContext
const mockUseAuth = vi.fn();
const mockLogout = vi.fn();
vi.mock('./AuthContext', () => ({
    useAuth: () => mockUseAuth(),
    AuthProvider: ({ children }) => <div>{children}</div>
}));

// Mock WorkoutContext
const mockUseWorkout = vi.fn();
vi.mock('./context/WorkoutContext', () => ({
    useWorkout: () => mockUseWorkout(),
    WorkoutProvider: ({ children }) => <div>{children}</div>
}));

// Mock Services
vi.mock('./services/userService', () => ({
    userService: {
        checkTrainerStatus: vi.fn().mockResolvedValue(false)
    }
}));

// Mock Child Components to isolate App logic
vi.mock('./pages/HomeDashboard', () => ({ HomeDashboard: () => <div>Mocked Home Dashboard</div> }));
vi.mock('./pages/LoginPage', () => ({ default: () => <div>Mocked Login Page</div> }));
vi.mock('./DesktopSidebar', () => ({ DesktopSidebar: () => <div>Sidebar</div> }));
vi.mock('./BottomNavEnhanced', () => ({ BottomNavEnhanced: () => <div>BottomNav</div> }));

describe('App Smoke Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default Mock Returns
        mockUseWorkout.mockReturnValue({
            activeWorkoutId: null,
            startWorkout: vi.fn(),
            finishWorkout: vi.fn()
        });
    });

    it('renders login page even while auth is loading', async () => {
        mockUseAuth.mockReturnValue({ user: null, authLoading: true, logout: mockLogout });

        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Mocked Login Page')).toBeInTheDocument();
        });
    });

    it('renders login page when unauthenticated', async () => {
        mockUseAuth.mockReturnValue({ user: null, authLoading: false, logout: mockLogout });

        render(
            <MemoryRouter initialEntries={['/login']}>
                <App />
            </MemoryRouter>
        );

        // App redirects to /login if path is root and no user? 
        // Actually App.jsx: <Route path="/login" ... />
        // And ProtectedRoute protects "/".

        await waitFor(() => {
            expect(screen.getByText('Mocked Login Page')).toBeInTheDocument();
        });
    });

    it('renders home dashboard when authenticated', async () => {
        mockUseAuth.mockReturnValue({
            user: { uid: 'user123', displayName: 'Test User' },
            authLoading: false,
            logout: mockLogout
        });

        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        // Should render HomeDashboard inside ProtectedRoute
        await waitFor(() => {
            expect(screen.getByText('Mocked Home Dashboard')).toBeInTheDocument();
        });
    });
});
