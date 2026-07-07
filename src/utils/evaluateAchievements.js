
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

function getSessionDate(session) {
    const raw = session?.completedAt || session?.completedAtClient || session?.date || session?.createdAt || session?.timestamp;
    if (!raw) return new Date(0);
    if (typeof raw.toDate === 'function') return raw.toDate();
    if (raw instanceof Date) return raw;
    if (typeof raw === 'object' && typeof raw.seconds === 'number') return new Date(raw.seconds * 1000);

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

/**
 * Calcula estatísticas do usuário a partir do histórico de sessões.
 * @param {Array} sessions - Array de sessões de treino ordenadas por data (qualquer ordem, será ordenado internamente se necessário).
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

    // Ordenar por data ascendente para cálculo de PR e Streak
    const sortedSessions = [...sessions].sort((a, b) => {
        const dateA = getSessionDate(a);
        const dateB = getSessionDate(b);
        return dateA - dateB;
    });

    let totalWorkouts = 0;
    let totalTonnageKg = 0;
    let totalSets = 0;
    let totalReps = 0;
    let prsCount = 0;
    let distinctExercisesSet = new Set();

    // Mapas para rastrear PR: nomeExercício -> pesoMax
    const exerciseMaxWeight = {};

    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let workoutsLast7Days = 0;
    let workoutsCurrentYear = 0;

    // Auxiliares de Cálculo de Streak
    let currentStreak = 0;
    let lastDate = null;

    sortedSessions.forEach(session => {
        // Basic Counts
        totalWorkouts++;

        const date = getSessionDate(session);

        if (date >= oneWeekAgo) workoutsLast7Days++;
        if (date >= startOfYear) workoutsCurrentYear++;

        // Lógica de Streak (simplificada: verifica se é mesmo dia ou dia seguinte)
        // Na verdade, dias estritamente consecutivos. 
        // Precisa lidar com múltiplos treinos no mesmo dia.
        if (lastDate) {
            // const diffTime = Math.abs(date - lastDate);
            // const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // Mesmo dia: ignorar
            const isSameDay = date.getDate() === lastDate.getDate() &&
                date.getMonth() === lastDate.getMonth() &&
                date.getFullYear() === lastDate.getFullYear();

            if (!isSameDay) {
                // Verificar se é o dia seguinte
                // Construct midnight dates for comparison
                const d1 = new Date(lastDate); d1.setHours(0, 0, 0, 0);
                const d2 = new Date(date); d2.setHours(0, 0, 0, 0);
                const diffDaysMidnight = (d2 - d1) / (1000 * 60 * 60 * 24);

                if (diffDaysMidnight === 1) {
                    currentStreak++;
                } else {
                    currentStreak = 1; // Resetar streak se intervalo > 1 dia
                }
            }
        } else {
            currentStreak = 1;
        }
        lastDate = date;


        // Detalhes do Exercício
        const exercises = session.results || session.exercises || []; // Suporte a layout novo/legado

        // Auxiliar para iterar exercícios
        const processExercise = (name, sets) => {
            distinctExercisesSet.add(name);
            let sessionMaxWeight = 0;

            if (Array.isArray(sets)) {
                // Nova estrutura: array de séries
                sets.forEach(set => {
                    const w = Number(set.weight) || 0;
                    const r = Number(set.reps) || 0;
                    const isCompleted = set.completed !== false; // Assumir true se indefinido

                    if (isCompleted && w > 0 && r > 0) {
                        totalSets++;
                        totalReps += r;
                        totalTonnageKg += (w * r);
                        if (w > sessionMaxWeight) sessionMaxWeight = w;
                    }
                });
            } else {
                // Estrutura legada: pode ser objeto único {weight, reps}
                const w = Number(sets.weight) || 0;
                const r = Number(sets.reps) || 0;
                if (w > 0 && r > 0) {
                    totalSets++; // Assumir 1 série
                    totalReps += r;
                    totalTonnageKg += (w * r);
                    sessionMaxWeight = w;
                }
            }

            // Verificação de PR
            if (sessionMaxWeight > 0) {
                const currentMax = exerciseMaxWeight[name] || 0;
                if (sessionMaxWeight > currentMax) {
                    if (currentMax > 0) {
                        // Contar apenas como PR se superar um recorde positivo anterior? 
                        // Ou a primeira vez é um PR? Geralmente primeira vez é PR também (Novo PR!).
                        // Catálogo do usuário diz "Primeiro PR", "10 PRs".
                        // Se eu contar todo primeiro exercício como PR, usuários terão muitos PRs inicialmente.
                        // Mas estritamente falando, um PB é um PB.
                        prsCount++;
                    } else {
                        // Primeira vez fazendo exercício é tecnicamente um PR.
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

        distinctExercises: distinctExercisesSet.size,
        exerciseMaxes: exerciseMaxWeight
    };
}

/**
 * Replays history to find the exact date achievements were unlocked.
 * @param {Array} sessions 
 * @param {Array} catalog 
 * @returns {Object} map { [id]: { unlockedAt: ISOString, value: number } }
 */
export function evaluateHistory(sessions, catalog) {
    if (!sessions || sessions.length === 0) return {};

    // 1. Sort sessions
    const sortedSessions = [...sessions].sort((a, b) => {
        const dateA = getSessionDate(a);
        const dateB = getSessionDate(b);
        return dateA - dateB;
    });

    const unlockedMap = {};
    const runningStats = {
        totalWorkouts: 0,
        totalTonnage: 0,
        totalSets: 0,
        totalReps: 0,
        prsCount: 0,
        distinctExercises: new Set(),
        exerciseMaxes: {} // name -> maxWeight
    };

    // Sliding window for 7 days: array of timestamps
    let window7Days = [];

    // Streak tracking
    let currentStreak = 0;
    let lastDateObj = null;

    // Year tracking
    let currentYear = null;
    let workoutsInYear = 0;

    sortedSessions.forEach(session => {
        const dateObj = getSessionDate(session);
        const timestamp = dateObj.getTime();
        const isoDate = dateObj.toISOString();

        // --- UPDATE STATS ---

        // 1. Total Workouts
        runningStats.totalWorkouts++;

        // 2. Sliding Window (7 Days)
        window7Days.push(timestamp);
        // Remove older than 7 days relative to THIS session
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        window7Days = window7Days.filter(t => (timestamp - t) <= sevenDaysMs);
        // Note: This logic counts workouts within the 7 days ending at this session.
        // It's a valid interpretation of "X workouts in 7 days". 

        // 3. Streak
        if (lastDateObj) {
            const isSameDay = dateObj.getDate() === lastDateObj.getDate() &&
                dateObj.getMonth() === lastDateObj.getMonth() &&
                dateObj.getFullYear() === lastDateObj.getFullYear();

            if (!isSameDay) {
                const d1 = new Date(lastDateObj); d1.setHours(0, 0, 0, 0);
                const d2 = new Date(dateObj); d2.setHours(0, 0, 0, 0);
                const diffDays = (d2 - d1) / (1000 * 60 * 60 * 24);

                if (diffDays === 1) currentStreak++;
                else currentStreak = 1;
            }
        } else {
            currentStreak = 1;
        }
        lastDateObj = dateObj;

        // 4. Yearly
        if (currentYear !== dateObj.getFullYear()) {
            currentYear = dateObj.getFullYear();
            workoutsInYear = 0;
        }
        workoutsInYear++;

        // 5. Volume & PRs
        const exercises = session.results || session.exercises || [];

        const processSet = (name, set) => {
            const w = Number(set.weight) || 0;
            const r = Number(set.reps) || 0;
            const isCompleted = set.completed !== false;

            if (isCompleted && w > 0 && r > 0) {
                runningStats.totalSets++;
                runningStats.totalReps += r;
                runningStats.totalTonnage += (w * r);
                return w;
            }
            return 0;
        };

        const processExercise = (name, data) => {
            runningStats.distinctExercises.add(name);
            let sessionMax = 0;
            const sets = Array.isArray(data) ? data : [data];

            sets.forEach(s => {
                const w = processSet(name, s);
                if (w > sessionMax) sessionMax = w;
            });

            if (sessionMax > 0) {
                const currentMax = runningStats.exerciseMaxes[name] || 0;
                if (sessionMax > currentMax) {
                    // Always count as PR? Or only if currentMax > 0?
                    // Catalog implies "First PR" is a thing. Let's count all improvements/firsts.
                    runningStats.prsCount++;
                    runningStats.exerciseMaxes[name] = sessionMax;
                }
            }
        };

        if (Array.isArray(exercises)) {
            exercises.forEach(ex => processExercise(ex.name, ex.sets || ex));
        } else if (typeof exercises === 'object') {
            Object.entries(exercises).forEach(([n, d]) => processExercise(n, d));
        }


        // --- CHECK ACHIEVEMENTS ---
        catalog.forEach(ach => {
            if (unlockedMap[ach.id]) return; // Already unlocked

            let achieved = false;
            switch (ach.type) {
                case "total_workouts": achieved = runningStats.totalWorkouts >= ach.target; break;
                case "workouts_last_7_days": achieved = window7Days.length >= ach.target; break;
                case "streak_days": achieved = currentStreak >= ach.target; break;
                case "total_tonnage": achieved = runningStats.totalTonnage >= ach.target; break;
                case "total_sets": achieved = runningStats.totalSets >= ach.target; break;
                case "total_reps": achieved = runningStats.totalReps >= ach.target; break;
                case "prs_count": achieved = runningStats.prsCount >= ach.target; break;
                case "distinct_exercises": achieved = runningStats.distinctExercises.size >= ach.target; break;
                case "workouts_current_year": achieved = workoutsInYear >= ach.target; break;
            }

            if (achieved) {
                unlockedMap[ach.id] = {
                    unlockedAt: isoDate,
                    value: ach.target // Store target or actual? usually unlock date is most important
                };
            }
        });
    });

    return unlockedMap;
}

// Import catalog dynamically or assume it's passed? 
// Better to import it since it's static data.
import { achievementsCatalog } from '../data/achievementsCatalog';

/**
 * Checks if new achievements were unlocked by the current session.
 * @param {string} userId 
 * @param {Object} currentSessionData 
 * @param {Object} workoutServiceInstance 
 * @returns {Promise<Array>} Newly unlocked achievements array
 */
export async function checkNewAchievements(userId, currentSessionData, workoutServiceInstance) {
    if (!userId || !workoutServiceInstance) return [];

    try {
        // 1. Prefer a bounded recent window to keep post-workout evaluation fast.
        // A future user_stats aggregate can make lifetime achievements exact without full reads.
        const allSessions = typeof workoutServiceInstance.getRecentSessions === 'function'
            ? await workoutServiceInstance.getRecentSessions(userId, 300)
            : await workoutServiceInstance.getAllSessions(userId);

        // 2. Filter out the current session to get "Previous State"
        // We identify current session by ID or exact timestamp
        const currentId = currentSessionData.id;
        const currentTime = getSessionDate(currentSessionData).getTime();

        const previousSessions = allSessions.filter(s => {
            // Check ID if available
            if (s.id && currentId && s.id === currentId) return false;

            // Check Timestamp (if within 1s, assume same)
            const t = getSessionDate(s).getTime();
            if (Math.abs(t - currentTime) < 1000) return false;

            return true;
        });

        const historyWithCurrent = [...previousSessions, currentSessionData];

        // 3. Evaluate Both States
        const unlockedBefore = evaluateHistory(previousSessions, achievementsCatalog);
        const unlockedAfter = evaluateHistory(historyWithCurrent, achievementsCatalog);

        // 4. Diff
        const newUnlocks = [];
        Object.keys(unlockedAfter).forEach(id => {
            if (!unlockedBefore[id]) {
                const achievementDef = achievementsCatalog.find(a => a.id === id);
                if (achievementDef) {
                    newUnlocks.push({ ...achievementDef, ...unlockedAfter[id] });
                }
            }
        });

        return newUnlocks;

    } catch (e) {
        console.error("Error checking new achievements:", e);
        return [];
    }
}
