/**
 * useHomeDashboardCache.js
 * Liga o cache local à home: hidrata os estados com o último snapshot (num
 * setTimeout(0), como antes) e persiste o snapshot novo em tempo ocioso.
 * Recebe estados e setters de useHomeDashboardData, no formato de
 * hooks/workout-session/useSessionLoader. Efeitos movidos de HomeDashboard
 * (D17) sem mudança.
 */
import { useEffect, useRef } from 'react';
import {
    deserializeLatestSessionFromCache,
    deserializeStatsFromCache,
    getHomeDashboardCacheKey,
    loadHomeDashboardCache,
    saveHomeDashboardCache,
    serializeLatestSessionForCache,
    serializeStatsForCache
} from './homeDashboardCache';

export function useHomeDashboardCache({
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
}) {
    const cacheHydratedRef = useRef(false);
    const cacheKey = user?.uid ? getHomeDashboardCacheKey(user.uid) : null;

    useEffect(() => {
        cacheHydratedRef.current = false;
    }, [cacheKey]);

    useEffect(() => {
        if (!user || !cacheKey || cacheHydratedRef.current) return;
        cacheHydratedRef.current = true;

        const cached = loadHomeDashboardCache(cacheKey);
        if (!cached) return;

        const hydrateId = window.setTimeout(() => {
            if (Array.isArray(cached.templates)) {
                setTemplates(cached.templates);
                setLoadingTemplates(false);
            }

            if (cached.latestSession) {
                setLatestSession(deserializeLatestSessionFromCache(cached.latestSession));
            }

            const cachedStats = deserializeStatsFromCache(cached.stats);
            if (cachedStats) {
                setStats(cachedStats);
                setLoadingStats(false);
            }

            if (cached.nextAchievement !== undefined) {
                setNextAchievement(cached.nextAchievement);
            }
        }, 0);

        return () => window.clearTimeout(hydrateId);
        // Os setters vêm de useState (estáveis); estão aqui só para o lint.
    }, [cacheKey, user, setTemplates, setLatestSession, setStats, setNextAchievement, setLoadingTemplates, setLoadingStats]);

    useEffect(() => {
        if (!user || !cacheKey || (loadingTemplates && loadingStats)) return undefined;
        if (typeof window === 'undefined') return undefined;

        let cancelled = false;
        const payload = {
            updatedAt: Date.now(),
            templates,
            latestSession: serializeLatestSessionForCache(latestSession),
            stats: serializeStatsForCache(stats),
            nextAchievement
        };

        const persistCache = () => {
            if (cancelled) return;
            saveHomeDashboardCache(cacheKey, payload);
        };

        if ('requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(persistCache, { timeout: 1400 });
            return () => {
                cancelled = true;
                window.cancelIdleCallback(idleId);
            };
        }

        const timeoutId = window.setTimeout(persistCache, 260);
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [cacheKey, loadingStats, loadingTemplates, latestSession, nextAchievement, stats, templates, user]);
}
