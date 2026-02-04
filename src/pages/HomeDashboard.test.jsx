import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HomeDashboard } from './HomeDashboard';
import { workoutService } from '../services/workoutService';
import { getDoc } from 'firebase/firestore';

vi.mock('../StreakWeeklyGoalHybrid', () => ({
    StreakWeeklyGoalHybrid: () => <div>StreakWidget</div>
}));

vi.mock('../services/workoutService', () => ({
    workoutService: {
        subscribeToTemplates: vi.fn(),
        subscribeToSessions: vi.fn()
    }
}));

vi.mock('../firebaseConfig', () => ({
    db: {}
}));

vi.mock('../utils/evaluateAchievements', () => ({
    evaluateAchievements: vi.fn().mockReturnValue([
        {
            id: 'a1',
            title: 'Volume Inicial',
            description: 'Acumule volume.',
            category: 'Volume',
            progressRatio: 0.5,
            progressText: '50%'
        }
    ]),
    calculateStats: vi.fn().mockReturnValue({})
}));

describe('HomeDashboard', () => {
    const mockUser = { uid: 'user-1', displayName: 'Joao Silva' };

    beforeEach(() => {
        vi.clearAllMocks();
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ weeklyGoal: 4 })
        });
        workoutService.subscribeToTemplates.mockImplementation((_uid, cb) => {
            cb([{ id: 't1', name: 'Treino A', exercises: [{ name: 'Supino' }] }]);
            return vi.fn();
        });
        workoutService.subscribeToSessions.mockImplementation((_uid, cb) => {
            cb([
                {
                    id: 's1',
                    completedAtClient: new Date('2024-01-02'),
                    templateId: 't1',
                    templateName: 'Treino A'
                }
            ]);
            return vi.fn();
        });
    });

    it('renders greeting and streak widget', async () => {
        render(
            <HomeDashboard
                user={mockUser}
                onNavigateToCreateWorkout={vi.fn()}
                onNavigateToWorkout={vi.fn()}
                onNavigateToHistory={vi.fn()}
                onNavigateToAchievements={vi.fn()}
            />
        );

        expect(screen.getByText(/Bom|Boa/)).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('StreakWidget')).toBeInTheDocument();
        });
    });

    it('navigates to suggested workout on click', async () => {
        const onNavigateToWorkout = vi.fn();
        render(
            <HomeDashboard
                user={mockUser}
                onNavigateToCreateWorkout={vi.fn()}
                onNavigateToWorkout={onNavigateToWorkout}
                onNavigateToHistory={vi.fn()}
                onNavigateToAchievements={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Treino A')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Treino A'));
        expect(onNavigateToWorkout).toHaveBeenCalledWith('t1', 'Treino A');
    });

    it('shows create workout CTA when no templates', async () => {
        workoutService.subscribeToTemplates.mockImplementation((_uid, cb) => {
            cb([]);
            return vi.fn();
        });

        const onNavigateToCreateWorkout = vi.fn();
        render(
            <HomeDashboard
                user={mockUser}
                onNavigateToCreateWorkout={onNavigateToCreateWorkout}
                onNavigateToWorkout={vi.fn()}
                onNavigateToHistory={vi.fn()}
                onNavigateToAchievements={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Você ainda não tem treinos criados.')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Criar Primeiro Treino'));
        expect(onNavigateToCreateWorkout).toHaveBeenCalled();
    });

    it('navigates to achievements from next achievement card', async () => {
        const onNavigateToAchievements = vi.fn();
        render(
            <HomeDashboard
                user={mockUser}
                onNavigateToCreateWorkout={vi.fn()}
                onNavigateToWorkout={vi.fn()}
                onNavigateToHistory={vi.fn()}
                onNavigateToAchievements={onNavigateToAchievements}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Volume Inicial')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Ver todas'));
        expect(onNavigateToAchievements).toHaveBeenCalled();
    });
});
