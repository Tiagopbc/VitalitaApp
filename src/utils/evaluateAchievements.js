
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

        const date = session.completedAt?.toDate ? session.completedAt.toDate() : new Date(session.completedAt || 0);

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
