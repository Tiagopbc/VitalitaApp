import { achievementTargets } from "./achievementTargets.js";
import { createExerciseMaxTracker, normalizeExerciseName } from "./exerciseName.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TRANSITION_DATE = new Date(2026, 4, 11);

export function buildUserStatsFromSessions(sessions = [], options = {}) {
    const now = toDate(options.now) || new Date();
    const weeklyGoal = normalizePositiveNumber(options.weeklyGoal, 4);
    const validSessions = sessions
        .map((session) => ({
            ...session,
            __date: getSessionDate(session)
        }))
        .filter((session) => session.__date && !Number.isNaN(session.__date.getTime()))
        .sort((a, b) => a.__date - b.__date);

    const totals = createEmptyTotals();
    const exerciseMaxTracker = createExerciseMaxTracker();
    const distinctExercises = new Set();
    const last7DaysCutoff = new Date(now.getTime() - 7 * MS_PER_DAY);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const currentMonthKey = getMonthKey(now);
    let lastWorkoutAt = null;

    const achievementHistory = {};
    const slidingSevenDays = [];
    let dailyStreak = 0;
    let longestDailyStreak = 0;
    let lastDailyDate = null;
    let workoutsInCurrentYear = 0;
    let runningYear = null;

    validSessions.forEach((session) => {
        const sessionDate = session.__date;
        const sessionMonthKey = getMonthKey(sessionDate);
        lastWorkoutAt = sessionDate;

        totals.totalWorkouts += 1;
        if (session.isCardio) totals.cardioWorkouts += 1;
        else totals.strengthWorkouts += 1;

        if (sessionDate >= last7DaysCutoff) totals.workoutsLast7Days += 1;
        if (sessionDate >= startOfYear) totals.workoutsCurrentYear += 1;
        if (sessionMonthKey === currentMonthKey) totals.monthlyVolume += getSessionVolume(session);

        const durationSeconds = getDurationSeconds(session);
        totals.totalDurationSeconds += durationSeconds;

        const dailyDistance = updateDailyStreak(sessionDate, lastDailyDate, dailyStreak);
        dailyStreak = dailyDistance.current;
        lastDailyDate = dailyDistance.lastDate;
        longestDailyStreak = Math.max(longestDailyStreak, dailyStreak);

        slidingSevenDays.push(sessionDate.getTime());
        while (slidingSevenDays.length && sessionDate.getTime() - slidingSevenDays[0] > 7 * MS_PER_DAY) {
            slidingSevenDays.shift();
        }

        if (runningYear !== sessionDate.getFullYear()) {
            runningYear = sessionDate.getFullYear();
            workoutsInCurrentYear = 0;
        }
        workoutsInCurrentYear += 1;

        collectExerciseStats(session, totals, exerciseMaxTracker, distinctExercises);

        const runningStats = {
            totalWorkouts: totals.totalWorkouts,
            currentStreakDays: dailyStreak,
            workoutsLast7Days: slidingSevenDays.length,
            workoutsCurrentYear: workoutsInCurrentYear,
            totalTonnageKg: totals.totalTonnageKg,
            totalSets: totals.totalSets,
            totalReps: totals.totalReps,
            prsCount: totals.prsCount,
            distinctExercises: distinctExercises.size
        };

        unlockAchievements(achievementHistory, runningStats, sessionDate);
    });

    const exerciseMaxes = exerciseMaxTracker.toObject();
    const weekly = calculateWeeklyAggregates(validSessions, weeklyGoal, now);
    const uniqueCurrentWeekDays = weekly.currentWeekActiveDays;

    const achievementStats = {
        totalWorkouts: totals.totalWorkouts,
        currentStreakDays: dailyStreak,
        workoutsLast7Days: totals.workoutsLast7Days,
        workoutsCurrentYear: totals.workoutsCurrentYear,
        totalTonnageKg: totals.totalTonnageKg,
        totalSets: totals.totalSets,
        totalReps: totals.totalReps,
        prsCount: totals.prsCount,
        distinctExercises: distinctExercises.size,
        exerciseMaxes
    };

    return {
        schemaVersion: 1,
        source: "cloud_functions",
        userId: options.userId || null,
        sessionCount: validSessions.length,
        weeklyGoal,
        weeklyCompleted: uniqueCurrentWeekDays,
        currentStreak: weekly.currentStreak,
        longestStreak: weekly.longestStreak,
        currentWeeklyStreak: weekly.currentStreak,
        longestWeeklyStreak: weekly.longestStreak,
        currentDailyStreak: dailyStreak,
        longestDailyStreak,
        totalWorkouts: totals.totalWorkouts,
        strengthWorkouts: totals.strengthWorkouts,
        cardioWorkouts: totals.cardioWorkouts,
        totalDurationSeconds: totals.totalDurationSeconds,
        totalTonnageKg: totals.totalTonnageKg,
        totalVolume: totals.totalTonnageKg,
        monthlyVolume: totals.monthlyVolume,
        totalSets: totals.totalSets,
        totalReps: totals.totalReps,
        prsCount: totals.prsCount,
        distinctExercises: distinctExercises.size,
        exerciseMaxes,
        lastWorkoutAt,
        lastWorkoutAtISO: lastWorkoutAt ? lastWorkoutAt.toISOString() : null,
        currentWeekKey: getWeekString(getStartOfWeek(now)),
        currentMonthKey,
        achievementStats,
        achievements: achievementHistory
    };
}

/**
 * União do histórico de conquistas já gravado com o recém-calculado, mantendo
 * a data mais antiga. Conquista desbloqueada nunca volta a bloquear: o rebuild
 * sobrescreve o doc inteiro ({ merge: false }) e a normalização de nomes pode
 * derrubar `prsCount`/`distinctExercises` abaixo do alvo que já foi batido.
 */
export function mergeUnlockedAchievements(previous = {}, computed = {}) {
    const merged = { ...(previous || {}) };

    Object.entries(computed || {}).forEach(([id, entry]) => {
        const existing = merged[id];
        if (!existing) {
            merged[id] = entry;
            return;
        }

        const existingAt = Date.parse(existing.unlockedAt);
        const computedAt = Date.parse(entry.unlockedAt);
        const keepExisting = Number.isFinite(existingAt)
            && (!Number.isFinite(computedAt) || existingAt <= computedAt);

        merged[id] = keepExisting ? existing : entry;
    });

    return merged;
}

function createEmptyTotals() {
    return {
        totalWorkouts: 0,
        strengthWorkouts: 0,
        cardioWorkouts: 0,
        totalDurationSeconds: 0,
        totalTonnageKg: 0,
        monthlyVolume: 0,
        totalSets: 0,
        totalReps: 0,
        prsCount: 0,
        workoutsLast7Days: 0,
        workoutsCurrentYear: 0
    };
}

function collectExerciseStats(session, totals, exerciseMaxTracker, distinctExercises) {
    const exercises = session.results || session.exercises || [];

    const processSet = (set) => {
        const weight = Number(set?.weight) || 0;
        const reps = Number(set?.reps) || 0;
        const isCompleted = set?.completed !== false;

        if (!isCompleted || weight <= 0 || reps <= 0) return 0;

        totals.totalSets += 1;
        totals.totalReps += reps;
        totals.totalTonnageKg += weight * reps;
        return weight;
    };

    const processExercise = (name, data) => {
        // Grafias diferentes do mesmo exercício compartilham a chave canônica:
        // sem isto elas contariam como exercícios distintos e como PR extra.
        const key = normalizeExerciseName(name);
        if (!key) return;
        distinctExercises.add(key);

        const sets = Array.isArray(data) ? data : [data];
        let sessionMaxWeight = 0;

        sets.forEach((set) => {
            const weight = processSet(set);
            if (weight > sessionMaxWeight) sessionMaxWeight = weight;

            if (Array.isArray(set?.drops)) {
                set.drops.forEach((drop) => {
                    const dropWeight = processSet(drop);
                    if (dropWeight > sessionMaxWeight) sessionMaxWeight = dropWeight;
                });
            }
        });

        if (exerciseMaxTracker.record(name, sessionMaxWeight)) {
            totals.prsCount += 1;
        }
    };

    if (Array.isArray(exercises)) {
        exercises.forEach((exercise) => processExercise(exercise.name, exercise.sets || exercise));
        return;
    }

    if (exercises && typeof exercises === "object") {
        Object.entries(exercises).forEach(([name, data]) => processExercise(name, data));
    }
}

function getSessionVolume(session) {
    const totals = createEmptyTotals();
    collectExerciseStats(session, totals, createExerciseMaxTracker(), new Set());
    return totals.totalTonnageKg;
}

function getDurationSeconds(session) {
    if (Number.isFinite(Number(session.elapsedSeconds))) return Number(session.elapsedSeconds);
    if (Number.isFinite(Number(session.durationSeconds))) return Number(session.durationSeconds);
    if (Number.isFinite(Number(session.durationMin))) return Number(session.durationMin) * 60;
    return 0;
}

function unlockAchievements(unlockedMap, stats, date) {
    achievementTargets.forEach((achievement) => {
        if (unlockedMap[achievement.id]) return;
        const value = getAchievementValue(achievement.type, stats);
        if (value >= achievement.target) {
            unlockedMap[achievement.id] = {
                unlockedAt: date.toISOString(),
                value: achievement.target
            };
        }
    });
}

function getAchievementValue(type, stats) {
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

function calculateWeeklyAggregates(sessions, weeklyGoal, now) {
    const weekCounts = new Map();
    const weekActiveDays = new Map();
    const weekStarts = new Map();

    sessions.forEach((session) => {
        const date = session.__date || getSessionDate(session);
        if (!date || Number.isNaN(date.getTime())) return;

        const weekStart = getStartOfWeek(date);
        const weekKey = getWeekString(weekStart);
        weekStarts.set(weekKey, weekStart);
        weekCounts.set(weekKey, (weekCounts.get(weekKey) || 0) + 1);

        if (!weekActiveDays.has(weekKey)) {
            weekActiveDays.set(weekKey, new Set());
        }
        weekActiveDays.get(weekKey).add(getDateKey(date));
    });

    const weeksMeetingGoal = new Set();
    weekStarts.forEach((weekStart, weekKey) => {
        const isLegacyWeek = weekStart < TRANSITION_DATE;
        const activeDays = weekActiveDays.get(weekKey)?.size || 0;
        const metGoal = isLegacyWeek
            ? (weekCounts.get(weekKey) || 0) >= weeklyGoal
            : activeDays >= weeklyGoal;

        if (metGoal) weeksMeetingGoal.add(weekKey);
    });

    const currentWeekStart = getStartOfWeek(now);
    let currentStreak = 0;
    let checkDate = new Date(currentWeekStart);
    if (weeksMeetingGoal.has(getWeekString(checkDate))) {
        currentStreak += 1;
    }
    checkDate.setDate(checkDate.getDate() - 7);
    while (weeksMeetingGoal.has(getWeekString(checkDate))) {
        currentStreak += 1;
        checkDate.setDate(checkDate.getDate() - 7);
    }

    const sortedWeekStarts = Array.from(weeksMeetingGoal)
        .map((weekKey) => weekStarts.get(weekKey))
        .filter(Boolean)
        .sort((a, b) => a - b);

    let longestStreak = 0;
    let run = 0;
    sortedWeekStarts.forEach((weekStart, index) => {
        if (index === 0) {
            run = 1;
        } else {
            const diffDays = (weekStart - sortedWeekStarts[index - 1]) / MS_PER_DAY;
            run = diffDays === 7 ? run + 1 : 1;
        }
        longestStreak = Math.max(longestStreak, run);
    });

    return {
        currentStreak,
        longestStreak,
        currentWeekActiveDays: weekActiveDays.get(getWeekString(currentWeekStart))?.size || 0
    };
}

function updateDailyStreak(date, lastDate, currentStreak) {
    if (!lastDate) {
        return { current: 1, lastDate: date };
    }

    if (isSameDay(date, lastDate)) {
        return { current: currentStreak, lastDate };
    }

    const previousDay = toMidnight(lastDate);
    const currentDay = toMidnight(date);
    const diffDays = (currentDay - previousDay) / MS_PER_DAY;

    return {
        current: diffDays === 1 ? currentStreak + 1 : 1,
        lastDate: date
    };
}

function getSessionDate(session) {
    return toDate(session?.completedAt)
        || toDate(session?.completedAtClient)
        || toDate(session?.date)
        || toDate(session?.createdAt);
}

function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === "function") return value.toDate();
    if (typeof value === "object" && typeof value.seconds === "number") {
        return new Date(value.seconds * 1000);
    }
    if (typeof value === "string" || typeof value === "number") {
        return new Date(value);
    }
    return null;
}

function normalizePositiveNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toMidnight(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function isSameDay(a, b) {
    return a.getDate() === b.getDate()
        && a.getMonth() === b.getMonth()
        && a.getFullYear() === b.getFullYear();
}

function getStartOfWeek(date) {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
    copy.setDate(diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function getWeekString(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    copy.setDate(copy.getDate() + 4 - (copy.getDay() || 7));
    const yearStart = new Date(copy.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((copy - yearStart) / MS_PER_DAY) + 1) / 7);
    return `${copy.getFullYear()}-W${weekNo}`;
}

function getDateKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
