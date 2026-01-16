import { describe, it, expect } from 'vitest';
import { calculateWeeklyStats } from './workoutStats';

describe('workoutStats', () => {
    describe('calculateWeeklyStats', () => {
        it('should calculate stats correctly for empty sessions', () => {
            const stats = calculateWeeklyStats([]);
            expect(stats.completedThisWeek).toBe(0);
            expect(stats.currentStreak).toBe(0);
            expect(stats.weekDays).toHaveLength(7);
        });

        it('should count sessions from this week', () => {
            const now = new Date();
            // Create a date for yesterday
            const today = new Date();
            const sessions = [
                { completedAt: today, workoutName: 'Leg Day' }
            ];

            const stats = calculateWeeklyStats(sessions);
            expect(stats.completedThisWeek).toBe(1);
        });

        it('should return correct structure for weekDays', () => {
            const stats = calculateWeeklyStats([]);
            const firstDay = stats.weekDays[0];

            expect(firstDay).toHaveProperty('day');
            expect(firstDay).toHaveProperty('label');
            expect(firstDay).toHaveProperty('trained');
            expect(firstDay).toHaveProperty('isRest');
        });
    });
});
