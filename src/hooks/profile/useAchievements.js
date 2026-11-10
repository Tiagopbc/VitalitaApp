import { useEffect, useMemo, useState } from 'react';
import { achievementsCatalog } from '../../data/achievementsCatalog';
import { calculateStats, evaluateAchievements, evaluateHistory } from '../../utils/evaluateAchievements';
import { calculateWeeklyStats } from '../../utils/workoutStats';
import { SESSION_LIMITS, workoutService } from '../../services/workoutService';

/**
 * Carrega estatísticas e conquistas calculadas no cliente a partir das sessões
 * recentes (única fonte desde o ADR-0006), reavaliando a lista quando
 * estatísticas ou perfil mudam.
 * Recebe `profile` para reagir à meta semanal e mesclar overrides manuais.
 */
export function useAchievements(user, profile) {
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
                // 1. Janela recente de sessões (limite em SESSION_LIMITS.profileStats).
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

    // Derivado, não estado: a lista é função pura de estatísticas + perfil +
    // histórico calculado. Guardá-la em `useState` alimentado por efeito custava
    // um render a mais a cada mudança e abria espaço para a lista discordar das
    // suas próprias entradas por um quadro. `useMemo` elimina os dois.
    const achievementsList = useMemo(() => {
        if (!stats || !profile) return [];

        // Calculado tem prioridade sobre o mapa do perfil: o histórico recalculado
        // é mais preciso para "quando aconteceu a primeira vez", enquanto o perfil
        // guarda overrides manuais futuros.
        const mergedUnlockedMap = { ...profile.achievements, ...calculatedHistoryMap };

        return evaluateAchievements(achievementsCatalog, stats, mergedUnlockedMap);
    }, [stats, profile, calculatedHistoryMap]);

    return { achievementsList, stats, loadingAchievements };
}
