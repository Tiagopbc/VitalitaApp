import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StreakWeeklyGoalHybrid } from '../StreakWeeklyGoalHybrid';
import React from 'react';

describe('StreakWeeklyGoalHybrid Component', () => {
    const defaultProps = {
        currentStreak: 3,
        bestStreak: 5,
        weeklyGoal: 4,
        completedThisWeek: 2,
        weekDays: [
            { dateNumber: 10, trained: true, isRest: false, fullDate: new Date(2023, 0, 10) },
            { dateNumber: 11, trained: false, isRest: false, fullDate: new Date(2023, 0, 11) },
            { dateNumber: 12, trained: true, isRest: false, fullDate: new Date(2023, 0, 12) }, // Today?
            { dateNumber: 13, trained: false, isRest: true, fullDate: new Date(2023, 0, 13) },
            { dateNumber: 14, trained: false, isRest: false, fullDate: new Date(2023, 0, 14) },
            { dateNumber: 15, trained: false, isRest: false, fullDate: new Date(2023, 0, 15) },
            { dateNumber: 16, trained: false, isRest: true, fullDate: new Date(2023, 0, 16) },
        ],
        monthDays: [], // Simplified for test
        showRings: false
    };

    it('renders streak stats correctly', () => {
        render(<StreakWeeklyGoalHybrid {...defaultProps} />);

        expect(screen.getByText('3')).toBeInTheDocument(); // Current Streak
        expect(screen.getByText(/Recorde: 5/i)).toBeInTheDocument();
    });

    it('displays weekly progress', () => {
        render(<StreakWeeklyGoalHybrid {...defaultProps} />);

        // 2 out of 4 is 50%
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // completed count
        expect(screen.getByText(/de 4 treinos/i)).toBeInTheDocument();
    });

    it('renders correct day status', () => {
        render(<StreakWeeklyGoalHybrid {...defaultProps} />);

        // Look for day numbers
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('11')).toBeInTheDocument();

        // Verify "Feito" legend exists
        expect(screen.getByText('Feito')).toBeInTheDocument();
    });

    it('shows risk warning when remaining days < remaining workouts', () => {
        // Goal: 5, Completed: 0. Remaining: 5.
        // We need 'daysRemaining' < 5.
        // 'daysRemaining' counts days that are !trained and !isRest.
        // So let's make 4 days Rest, and 3 days available.
        // 5 > 3 => Risk.
        const riskyProps = {
            ...defaultProps,
            weeklyGoal: 5,
            completedThisWeek: 0,
            weekDays: defaultProps.weekDays.map((d, idx) => ({
                ...d,
                trained: false,
                // Set first 4 days as rest, leaving 3 available
                isRest: idx < 4
            }))
        };

        render(<StreakWeeklyGoalHybrid {...riskyProps} />);

        expect(screen.getByText(/Faltam 5/i)).toBeInTheDocument();
    });
});
