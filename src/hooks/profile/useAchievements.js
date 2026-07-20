import { useEffect, useState } from 'react';
import { achievementsCatalog } from '../../data/achievementsCatalog';
import { calculateStats, evaluateAchievements, evaluateHistory } from '../../utils/evaluateAchievements';
import { calculateWeeklyStats } from '../../utils/workoutStats';
import { SESSION_LIMITS, workoutService } from '../../services/workoutService';
import { userStatsService } from '../../services/userStatsService';

/**
 * Carrega estatísticas e conquistas com estratégia server-first e fallback
 * client-side (`user_stats` ausente → cálculo a partir das sessões recentes),
 * reavaliando a lista quando estatísticas ou perfil mudam.
 * Recebe `profile` para reagir à meta semanal e mesclar overrides manuais.
 */
export function useAchievements(user, profile) {
    const [achievementsList, setAchievementsList] = useState([]);
    const [stats, setStats] = useState(null);
    const [loadingAchievements, setLoadingAchievements] = useState(true);
    // Armazenar histórico calculado localmente para combinar com o perfil
    const [calculatedHistoryMap, setCalculatedHistoryMap] = useState({});

    // Carregar Dados de Conquistas
    useEffect(() => {
        if (!user) return;

        async function loadAchievementsData() {
            setLoadingAchievements(true);
            try {
                const serverStats = await userStatsService.getUserStats(user.uid);
                if (serverStats) {
                    const achievementStats = serverStats.achievementStats || {};
                    setStats({
                        ...achievementStats,
                        totalWorkouts: serverStats.totalWorkouts,
                        totalTonnageKg: serverStats.totalTonnageKg,
                        totalSets: serverStats.totalSets,
                        totalReps: serverStats.totalReps,
                        prsCount: serverStats.prsCount,
                        distinctExercises: serverStats.distinctExercises,
                        exerciseMaxes: achievementStats.exerciseMaxes || serverStats.exerciseMaxes || {},
                        weeklyStreak: serverStats.currentWeeklyStreak,
                        weeklyBestStreak: serverStats.longestWeeklyStreak,
                        weeklyGoal: serverStats.weeklyGoal
                    });
                    setCalculatedHistoryMap(serverStats.achievements || {});
                    return;
                }

                // 1. Fallback temporário enquanto a function ainda não criou user_stats.
                const sessions = await workoutService.getRecentSessions(user.uid, SESSION_LIMITS.profileStats);

                // 2. Calcular Estatísticas
                const computedStats = calculateStats(sessions);
                const weeklyGoal = profile?.weeklyGoal || 4;
                const weeklyStats = calculateWeeklyStats(sessions, weeklyGoal);
                setStats({
                    ...computedStats,
                    weeklyStreak: weeklyStats.currentStreak,
                    weeklyBestStreak: weeklyStats.bestStreak,
                    weeklyGoal: weeklyStats.weeklyGoal
                });

                // 3. Calcular Histórico de Conquistas (Datas Reais)
                const historyMap = evaluateHistory(sessions, achievementsCatalog);
                setCalculatedHistoryMap(historyMap);

            } catch (err) {
                console.error("Error loading achievements data:", err);
            } finally {
                setLoadingAchievements(false);
            }
        }

        void loadAchievementsData();
    }, [user, profile?.weeklyGoal]); // Recalcular se meta semanal mudar.

    // Reavaliar quando estatísticas ou perfil mudarem
    useEffect(() => {
        if (stats && profile) {
            // Combinar mapa do perfil com mapa calculado (Calculado tem prioridade para corrigir datas antigas, mas perfil pode ter overrides manuais futuros)
            // Na verdade, calculo histórico é mais preciso para "quando aconteceu a primeira vez".
            const mergedUnlockedMap = { ...profile.achievements, ...calculatedHistoryMap };

            const evaluated = evaluateAchievements(achievementsCatalog, stats, mergedUnlockedMap);
            setAchievementsList(evaluated);
        }
    }, [stats, profile, calculatedHistoryMap]);

    return { achievementsList, stats, loadingAchievements };
}
