import { describe, expect, it, vi, beforeEach } from 'vitest';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { isServerUserStatsEnabled, normalizeUserStats, userStatsService } from './userStatsService';

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        doc: vi.fn(),
        getDoc: vi.fn(),
        onSnapshot: vi.fn()
    };
});

vi.mock('../firebaseDb', () => ({
    getFirestoreDeps: () => Promise.resolve({
        db: {},
        doc,
        getDoc,
        onSnapshot
    })
}));

describe('userStatsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    it('normalizes server aggregate fields for achievement evaluation', () => {
        const normalized = normalizeUserStats({
            totalWorkouts: '12',
            totalVolume: 9000,
            currentWeeklyStreak: 2,
            currentDailyStreak: 5,
            achievementStats: {
                totalSets: '44'
            },
            achievements: {
                w_1: { unlockedAt: '2026-07-01T00:00:00.000Z' }
            }
        });

        expect(normalized.totalWorkouts).toBe(12);
        expect(normalized.totalTonnageKg).toBe(9000);
        expect(normalized.currentStreak).toBe(2);
        expect(normalized.achievementStats.currentStreakDays).toBe(5);
        expect(normalized.achievementStats.totalSets).toBe(44);
        expect(normalized.achievements.w_1).toBeTruthy();
    });

    it('reads user_stats by user id', async () => {
        vi.stubEnv('VITE_ENABLE_SERVER_USER_STATS', 'true');
        doc.mockReturnValue('stats-ref');
        getDoc.mockResolvedValue({
            exists: () => true,
            id: 'user-1',
            data: () => ({
                totalWorkouts: 3,
                totalTonnageKg: 1200
            })
        });

        const stats = await userStatsService.getUserStats('user-1');

        expect(doc).toHaveBeenCalledWith(expect.anything(), 'user_stats', 'user-1');
        expect(stats.totalWorkouts).toBe(3);
        expect(stats.totalTonnageKg).toBe(1200);
    });

    it('subscribes to aggregate updates', async () => {
        vi.stubEnv('VITE_ENABLE_SERVER_USER_STATS', 'true');
        const onUpdate = vi.fn();
        const unsubscribe = vi.fn();
        let callback;
        doc.mockReturnValue('stats-ref');
        onSnapshot.mockImplementation((_ref, cb) => {
            callback = cb;
            return unsubscribe;
        });

        const result = await userStatsService.subscribeToUserStats('user-1', onUpdate);
        callback({
            exists: () => true,
            id: 'user-1',
            data: () => ({ totalWorkouts: 5 })
        });

        expect(result).toBe(unsubscribe);
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ totalWorkouts: 5 }));
    });

    it('keeps server aggregates disabled by default for Spark projects', async () => {
        const onUpdate = vi.fn();

        expect(isServerUserStatsEnabled()).toBe(false);
        await expect(userStatsService.getUserStats('user-1')).resolves.toBeNull();

        const unsubscribe = await userStatsService.subscribeToUserStats('user-1', onUpdate);
        unsubscribe();

        expect(getDoc).not.toHaveBeenCalled();
        expect(onSnapshot).not.toHaveBeenCalled();
        expect(onUpdate).toHaveBeenCalledWith(null);
    });
});
