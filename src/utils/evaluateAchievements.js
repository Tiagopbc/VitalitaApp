
// evaluateAchievements.js

export function evaluateAchievements(catalog, stats, unlockedMap = {}) {
    return catalog.map((a) => {
        const value = getValue(a.type, stats);
        const isUnlocked = value >= a.target;

        const unlockedAt =
            unlockedMap[a.id]?.unlockedAt ??
            (isUnlocked ? new Date().toISOString() : null);

        return {
            ...a,
            value,
            isUnlocked,
            unlockedAt,
            progressValue: Math.min(value, a.target),
            progressRatio: Math.min(1, value / a.target),
            progressText: format(a, value)
        };
    });
}

function getValue(type, stats) {
    switch (type) {
        case "total_workouts": return stats.totalWorkouts || 0;
        case "streak_days": return stats.currentStreakDays || 0;
        case "workouts_last_7_days": return stats.workoutsLast7Days || 0;
        case "total_tonnage": return stats.totalTonnageKg || 0;
        case "total_sets": return stats.totalSets || 0;
        case "total_reps": return stats.totalReps || 0;
        case "prs_count": return stats.prsCount || 0;
        case "distinct_exercises": return stats.distinctExercises || 0;
        case "workouts_current_year": return stats.workoutsCurrentYear || 0;
        default: return 0;
    }
}

function format(a, value) {
    if (a.format === "kg_to_tons") {
        return `${(value / 1000).toFixed(1)} / ${(a.target / 1000)} t`;
    }
    return `${Math.min(value, a.target)} / ${a.target}`;
}

/**
 * Calculates user statistics from workout sessions history.
 * @param {Array} sessions - Array of workout sessions sorted by date (any order, will be sorted internally if needed).
 * @returns {Object} stats object for evaluateAchievements
 */
export function calculateStats(sessions) {
    if (!sessions || sessions.length === 0) {
        return {
            totalWorkouts: 0,
            currentStreakDays: 0,
            workoutsLast7Days: 0,
            workoutsCurrentYear: 0,
            totalTonnageKg: 0,
            totalSets: 0,
            totalReps: 0,
            prsCount: 0,
            distinctExercises: 0
        };
    }

    // Sort by date ascending for PR calculation and Streak
    const sortedSessions = [...sessions].sort((a, b) => {
        const dateA = a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.completedAt || 0);
        const dateB = b.completedAt?.toDate ? b.completedAt.toDate() : new Date(b.completedAt || 0);
        return dateA - dateB;
    });

    let totalWorkouts = 0;
    let totalTonnageKg = 0;
    let totalSets = 0;
    let totalReps = 0;
    let prsCount = 0;
    let distinctExercisesSet = new Set();

    // Maps for PR tracking: exerciseName -> maxWeight
    const exerciseMaxWeight = {};

    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let workoutsLast7Days = 0;
    let workoutsCurrentYear = 0;

    // Streak Calculation Helpers
    let currentStreak = 0;
    let lastDate = null;

    sortedSessions.forEach(session => {
        // Basic Counts
        totalWorkouts++;

        const date = session.completedAt?.toDate ? session.completedAt.toDate() : new Date(session.completedAt || 0);

        if (date >= oneWeekAgo) workoutsLast7Days++;
        if (date >= startOfYear) workoutsCurrentYear++;

        // Streak Logic (simplified: check if same day or next day)
        // Actually, strictly consecutive days. 
        // Needs to handle multiple workouts same day.
        if (lastDate) {
            const diffTime = Math.abs(date - lastDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // Same day: ignore
            const isSameDay = date.getDate() === lastDate.getDate() &&
                date.getMonth() === lastDate.getMonth() &&
                date.getFullYear() === lastDate.getFullYear();

            if (!isSameDay) {
                // Check if it is the very next day
                // Construct midnight dates for comparison
                const d1 = new Date(lastDate); d1.setHours(0, 0, 0, 0);
                const d2 = new Date(date); d2.setHours(0, 0, 0, 0);
                const diffDaysMidnight = (d2 - d1) / (1000 * 60 * 60 * 24);

                if (diffDaysMidnight === 1) {
                    currentStreak++;
                } else {
                    currentStreak = 1; // Reset streak if gap > 1 day
                }
            }
        } else {
            currentStreak = 1;
        }
        lastDate = date;


        // Exercise Details
        const exercises = session.results || session.exercises || []; // Support legacy/new layout

        // Helper to iterate exercises
        const processExercise = (name, sets) => {
            distinctExercisesSet.add(name);
            let sessionMaxWeight = 0;

            if (Array.isArray(sets)) {
                // New structure: sets array
                sets.forEach(set => {
                    const w = Number(set.weight) || 0;
                    const r = Number(set.reps) || 0;
                    const isCompleted = set.completed !== false; // Assume true if undefined

                    if (isCompleted && w > 0 && r > 0) {
                        totalSets++;
                        totalReps += r;
                        totalTonnageKg += (w * r);
                        if (w > sessionMaxWeight) sessionMaxWeight = w;
                    }
                });
            } else {
                // Legacy structure: might be single object {weight, reps}
                const w = Number(sets.weight) || 0;
                const r = Number(sets.reps) || 0;
                if (w > 0 && r > 0) {
                    totalSets++; // Assume 1 set
                    totalReps += r;
                    totalTonnageKg += (w * r);
                    sessionMaxWeight = w;
                }
            }

            // PR Check
            if (sessionMaxWeight > 0) {
                const currentMax = exerciseMaxWeight[name] || 0;
                if (sessionMaxWeight > currentMax) {
                    if (currentMax > 0) {
                        // Only count as PR if it beats a previous positive record? 
                        // Or is first time a PR? Usually first time is a PR too (New PR!).
                        // User catalog says "Primeiro PR", "10 PRs".
                        // If I count every first exercise as a PR, users get lots of PRs initially.
                        // But strictly speaking, a PB is a PB.
                        prsCount++;
                    } else {
                        // First time doing exercise is technically a PR.
                        prsCount++;
                    }
                    exerciseMaxWeight[name] = sessionMaxWeight;
                }
            }
        };

        if (Array.isArray(exercises)) {
            exercises.forEach(ex => {
                processExercise(ex.name, ex.sets || ex);
            });
        } else if (typeof exercises === 'object') {
            Object.entries(exercises).forEach(([name, data]) => {
                processExercise(name, data);
            });
        }
    });

    return {
        totalWorkouts,
        currentStreakDays: currentStreak,
        workoutsLast7Days,
        workoutsCurrentYear,
        totalTonnageKg,
        totalSets,
        totalReps,
        prsCount,
        distinctExercises: distinctExercisesSet.size
    };
}
