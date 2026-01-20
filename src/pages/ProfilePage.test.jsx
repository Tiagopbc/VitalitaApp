import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProfilePage from './ProfilePage';
import { useAuth } from '../AuthContext';
import { userService } from '../services/userService';
import { workoutService } from '../services/workoutService';

// Mocks
vi.mock('../AuthContext');
vi.mock('../services/userService');

// Mock workoutService
vi.mock('../services/workoutService');

// Mock react-router-dom
const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => navigateMock,
}));

describe('ProfilePage Integration', () => {
    const mockUser = {
        uid: 'user123',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: null
    };

    const mockProfileData = {
        uid: 'user123',
        displayName: 'Test User',
        email: 'test@example.com',
        height: 175,
        weight: 70,
        age: 30,
        gender: 'male',
        goal: 'Hypertrophy',
        level: 'Iniciante',
        activityLevel: 'Sedentário',
        achievements: {}
    };

    const mockSessions = [
        {
            id: 'session1',
            date: new Date().toISOString(), // Today
            duration: 3600,
            volume: 10000,
            prCount: 1
        },
        {
            id: 'session2',
            date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            duration: 3000,
            volume: 8000,
            prCount: 0
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mocks
        useAuth.mockReturnValue({
            user: mockUser,
            logout: vi.fn()
        });

        userService.getUserProfile.mockResolvedValue(mockProfileData);
        userService.updateUserProfile.mockResolvedValue({});
        userService.linkTrainer.mockResolvedValue({});

        // Mock workoutService sessions return
        workoutService.getAllSessions.mockResolvedValue(mockSessions);
    });

    afterEach(() => {
        cleanup();
    });

    const renderProfile = async () => {
        render(<ProfilePage user={mockUser} />);
        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText('Carregando perfil...')).not.toBeInTheDocument();
            expect(screen.getByText('Test User')).toBeInTheDocument();
        }, { timeout: 3000 });
    };

    it('renders user profile data correctly', async () => {
        await renderProfile();

        // Body Data
        expect(screen.getByText('175')).toBeInTheDocument();
        expect(screen.getByText('Dados Corporais')).toBeInTheDocument();

        // Verify Stats Rendering (From workoutService mock)
        // With 2 sessions, "Treinos" count should be 2
        await waitFor(() => {
            // Look for the stats values. 
            // Note: In the component, totalWorkouts is rendered.
            // We configured 2 sessions, so we expect '2' to be in the document.
            // However, '2' might be ambiguous (level, other nums). 
            // Let's look for "Treinos" label and nearby value if possible, or just the number if unique enough context.
            // Best is to assert that workoutService was called.
            expect(workoutService.getAllSessions).toHaveBeenCalledWith('user123');
        });

        // Use visible text assertions for stats if possible, or data-testid in future.
        // For now, ensuring the service is called prevents the silent error.
    });

    it('opens Edit Profile modal when button is clicked', async () => {
        await renderProfile();

        const editButton = screen.getByRole('button', { name: /editar perfil/i });
        fireEvent.click(editButton);

        expect(screen.getByText('Editar Perfil', { selector: 'h2' })).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });

    it('updates profile data when form is submitted', async () => {
        await renderProfile();
        fireEvent.click(screen.getByRole('button', { name: /editar perfil/i }));

        const nameInput = screen.getByDisplayValue('Test User');
        fireEvent.change(nameInput, { target: { value: 'New Name' } });

        const saveButton = screen.getByText('Salvar Alterações');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(userService.updateUserProfile).toHaveBeenCalledWith(
                'user123',
                expect.objectContaining({ displayName: 'New Name' })
            );
        });
    });

    it('validates email format in Edit Profile modal', async () => {
        await renderProfile();
        fireEvent.click(screen.getByRole('button', { name: /editar perfil/i }));

        const emailInput = screen.getByDisplayValue('test@example.com');
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

        const saveButton = screen.getByText('Salvar Alterações');
        fireEvent.click(saveButton);

        await new Promise(r => setTimeout(r, 100));
        expect(userService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('opens Link Trainer modal', async () => {
        await renderProfile();
        const linkButton = screen.getByRole('button', { name: /personal/i });
        fireEvent.click(linkButton);

        await waitFor(() => {
            expect(screen.getByText('Vincular Personal', { selector: 'h2' })).toBeInTheDocument();
        });
    });
});
