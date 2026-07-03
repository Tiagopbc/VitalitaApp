import { getFirestoreDeps } from '../firebaseDb';

const USER_STATS_COLLECTION = 'user_stats';

function normalizeTimestamp(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'object' && typeof value.seconds === 'number') {
        return new Date(value.seconds * 1000);
    }
    if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}

export function normalizeUserStats(data) {
    if (!data || typeof data !== 'object') return null;

    const achievementStats = data.achievementStats || {};

    return {
        ...data,
        totalWorkouts: Number(data.totalWorkouts) || 0,
        totalTonnageKg: Number(data.totalTonnageKg ?? data.totalVolume) || 0,
        totalVolume: Number(data.totalVolume ?? data.totalTonnageKg) || 0,
        totalSets: Number(data.totalSets) || 0,
        totalReps: Number(data.totalReps) || 0,
        prsCount: Number(data.prsCount) || 0,
        distinctExercises: Number(data.distinctExercises) || 0,
        weeklyGoal: Number(data.weeklyGoal) || 4,
        weeklyCompleted: Number(data.weeklyCompleted) || 0,
        currentStreak: Number(data.currentStreak ?? data.currentWeeklyStreak) || 0,
        longestStreak: Number(data.longestStreak ?? data.longestWeeklyStreak) || 0,
        currentWeeklyStreak: Number(data.currentWeeklyStreak ?? data.currentStreak) || 0,
        longestWeeklyStreak: Number(data.longestWeeklyStreak ?? data.longestStreak) || 0,
        currentDailyStreak: Number(data.currentDailyStreak ?? achievementStats.currentStreakDays) || 0,
        lastWorkoutAt: normalizeTimestamp(data.lastWorkoutAt) || normalizeTimestamp(data.lastWorkoutAtISO),
        updatedAt: normalizeTimestamp(data.updatedAt),
        achievementStats: {
            ...achievementStats,
            totalWorkouts: Number(achievementStats.totalWorkouts ?? data.totalWorkouts) || 0,
            currentStreakDays: Number(achievementStats.currentStreakDays ?? data.currentDailyStreak) || 0,
            workoutsLast7Days: Number(achievementStats.workoutsLast7Days) || 0,
            workoutsCurrentYear: Number(achievementStats.workoutsCurrentYear) || 0,
            totalTonnageKg: Number(achievementStats.totalTonnageKg ?? data.totalTonnageKg ?? data.totalVolume) || 0,
            totalSets: Number(achievementStats.totalSets ?? data.totalSets) || 0,
            totalReps: Number(achievementStats.totalReps ?? data.totalReps) || 0,
            prsCount: Number(achievementStats.prsCount ?? data.prsCount) || 0,
            distinctExercises: Number(achievementStats.distinctExercises ?? data.distinctExercises) || 0,
            exerciseMaxes: achievementStats.exerciseMaxes || data.exerciseMaxes || {}
        },
        achievements: data.achievements || {}
    };
}

export const userStatsService = {
    async getUserStats(userId) {
        if (!userId) return null;
        const { db, doc, getDoc } = await getFirestoreDeps();
        const statsRef = doc(db, USER_STATS_COLLECTION, userId);
        const snap = await getDoc(statsRef);
        return snap.exists() ? normalizeUserStats({ id: snap.id, ...snap.data() }) : null;
    },

    async subscribeToUserStats(userId, onUpdate, onError) {
        if (!userId) return () => {};
        const { db, doc, onSnapshot } = await getFirestoreDeps();
        const statsRef = doc(db, USER_STATS_COLLECTION, userId);

        return onSnapshot(statsRef, (snapshot) => {
            onUpdate(snapshot.exists()
                ? normalizeUserStats({ id: snapshot.id, ...snapshot.data() })
                : null);
        }, (error) => {
            console.error('Error subscribing to user_stats:', error);
            if (onError) onError(error);
        });
    }
};
