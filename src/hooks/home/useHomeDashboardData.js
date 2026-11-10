/**
 * useHomeDashboardData.js
 * Dados da home: templates e sessões recentes por assinatura do Firestore,
 * meta semanal do usuário, estatísticas da semana (publishStats, a única
 * fonte desde o ADR-0006), próxima conquista e treino sugerido. Compõe
 * useHomeDashboardCache para abrir com o último snapshot. Lógica movida de
 * HomeDashboard (D17) sem mudança.
 */
import { useEffect, useMemo, useState } from 'react';
import { getFirestoreDeps } from '../../firebaseDb';
import { calculateWeeklyStats } from '../../utils/workoutStats';
import { SESSION_LIMITS, workoutService } from '../../services/workoutService';
import { achievementsCatalog } from '../../data/achievementsCatalog';
import { evaluateAchievements, calculateStats } from '../../utils/evaluateAchievements';
import { toDate } from '../../utils/firestoreDate';
import { pickSuggestedWorkout } from './suggestedWorkout';
import { useHomeDashboardCache } from './useHomeDashboardCache';

export function useHomeDashboardData(user) {
    // Inicializar com estrutura de estatísticas vazia (7 dias vazios) para prevenir calendário faltando
    const [stats, setStats] = useState(() => calculateWeeklyStats([], 4));
    const [nextAchievement, setNextAchievement] = useState(null);

    const [templates, setTemplates] = useState([]);
    const [latestSession, setLatestSession] = useState(null);

    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);

    // Treino sugerido, derivado.
    const suggestedWorkout = useMemo(
        () => pickSuggestedWorkout(templates, latestSession),
        [templates, latestSession]
    );

    useHomeDashboardCache({
        user,
        templates,
        latestSession,
        stats,
        nextAchievement,
        loadingTemplates,
        loadingStats,
        setTemplates,
        setLatestSession,
        setStats,
        setNextAchievement,
        setLoadingTemplates,
        setLoadingStats
    });

    // 2. Data Fetching & Subscriptions
    useEffect(() => {
        let unsubscribeTemplates = null;
        let unsubscribeSessions = null;

        async function fetchData() {
            if (!user) return;
            let effectiveGoal = 4;
            let latestSessionsSnapshot = [];
            let latestRecentStats = calculateWeeklyStats([], effectiveGoal);
            let recentSessionCount = 0;

            const publishStats = () => {
                setStats({
                    ...latestRecentStats,
                    totalSessions: recentSessionCount
                });
            };

            const publishNextAchievement = () => {
                const fullStats = calculateStats(latestSessionsSnapshot);
                const allAchievements = evaluateAchievements(achievementsCatalog, fullStats, {});
                const locked = allAchievements.filter(a => !a.isUnlocked);

                locked.sort((a, b) => b.progressRatio - a.progressRatio);
                setNextAchievement(locked[0] || null);
            };

            // 0. Buscar Meta do Usuário (Single Fetch, não precisa ser real-time crítico)
            try {
                const { db, doc, getDoc } = await getFirestoreDeps();
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists() && userSnap.data().weeklyGoal) {
                    effectiveGoal = parseInt(userSnap.data().weeklyGoal, 10) || 4;
                }
            } catch (err) {
                console.error("Error fetching user goal:", err);
            }

            // A. Inscrever-se em Treinos (Templates)
            try {
                unsubscribeTemplates = await workoutService.subscribeToTemplates(user.uid, (data) => {
                    setTemplates(data || []);
                    setLoadingTemplates(false);
                });
            } catch (err) {
                console.error("Template subscription error:", err);
                setLoadingTemplates(false);
            }

            // B. Inscrever-se apenas no histórico recente para manter o calendário leve.
            try {
                unsubscribeSessions = await workoutService.subscribeToRecentSessions(user.uid, (data) => {
                    const sessions = data.map(d => {
                        let dateObj = new Date();
                        // Lógica defensiva para parse de data
                        try {
                            const raw = d.completedAtClient || d.completedAt || d.date || d.createdAt || d.timestamp;
                            const parsedDate = toDate(raw);
                            if (parsedDate) dateObj = parsedDate;
                        } catch (e) { console.warn("Date parsing error", d.id, e); }

                        if (isNaN(dateObj.getTime())) dateObj = new Date();
                        return { ...d, date: dateObj };
                    });

                    // Ordenar por data (Mais recente primeiro)
                    sessions.sort((a, b) => b.date - a.date);

                    // Atualizar Última Sessão para a lógica de sugestão
                    if (sessions.length > 0) {
                        setLatestSession(sessions[0]);
                    } else {
                        setLatestSession(null);
                    }

                    // Calcular Estatísticas Semanais
                    latestSessionsSnapshot = sessions;
                    latestRecentStats = calculateWeeklyStats(sessions, effectiveGoal);
                    recentSessionCount = sessions.length;
                    publishStats();
                    publishNextAchievement();
                    setLoadingStats(false);
                }, SESSION_LIMITS.dashboardRecent);
            } catch (err) {
                console.error("Subscription Error:", err);
                publishStats();
                publishNextAchievement();
                setLoadingStats(false);
            }
        }

        fetchData();

        return () => {
            if (unsubscribeTemplates) unsubscribeTemplates();
            if (unsubscribeSessions) unsubscribeSessions();
        };
    }, [user]);

    return { stats, nextAchievement, templates, latestSession, loadingTemplates, loadingStats, suggestedWorkout };
}
