/**
 * homeDashboardCache.js
 * Cache local da home (localStorage, TTL de 30 min): a home abre com o último
 * snapshot enquanto as assinaturas do Firestore respondem. Funções puras,
 * movidas de HomeDashboard (D17) sem mudança.
 */
import { safeGetJSON, safeSetJSON, safeRemoveItem } from '../../utils/storage';
import { toDate } from '../../utils/firestoreDate';

const HOME_DASHBOARD_CACHE_VERSION = 1;

export const HOME_DASHBOARD_CACHE_TTL_MS = 30 * 60 * 1000;

export function getHomeDashboardCacheKey(userId) {
    return `home_dashboard_snapshot_v${HOME_DASHBOARD_CACHE_VERSION}_${userId}`;
}

export function serializeStatsForCache(stats) {
    if (!stats || typeof stats !== 'object') return null;
    const serializeDay = (day) => ({
        ...day,
        fullDate: day?.fullDate instanceof Date ? day.fullDate.toISOString() : day?.fullDate ?? null
    });
    return {
        ...stats,
        weekDays: Array.isArray(stats.weekDays) ? stats.weekDays.map(serializeDay) : [],
        monthDays: Array.isArray(stats.monthDays) ? stats.monthDays.map(serializeDay) : []
    };
}

export function deserializeStatsFromCache(cachedStats) {
    if (!cachedStats || typeof cachedStats !== 'object') return null;
    const deserializeDay = (day) => {
        const fullDate = toDate(day?.fullDate);
        return {
            ...day,
            fullDate: fullDate || day?.fullDate || null
        };
    };
    return {
        ...cachedStats,
        weekDays: Array.isArray(cachedStats.weekDays) ? cachedStats.weekDays.map(deserializeDay) : [],
        monthDays: Array.isArray(cachedStats.monthDays) ? cachedStats.monthDays.map(deserializeDay) : []
    };
}

export function serializeLatestSessionForCache(session) {
    if (!session || typeof session !== 'object') return null;
    const sessionDate = toDate(session.date || session.completedAtClient || session.completedAt || session.timestamp);
    return {
        ...session,
        date: sessionDate ? sessionDate.toISOString() : null
    };
}

export function deserializeLatestSessionFromCache(session) {
    if (!session || typeof session !== 'object') return null;
    const parsedDate = toDate(session.date || session.completedAtClient || session.completedAt || session.timestamp);
    return {
        ...session,
        date: parsedDate || new Date()
    };
}

export function loadHomeDashboardCache(cacheKey) {
    if (!cacheKey) return null;
    const parsed = safeGetJSON(cacheKey);
    if (!parsed) return null;

    const updatedAt = Number(parsed.updatedAt) || 0;
    if (!updatedAt || (Date.now() - updatedAt > HOME_DASHBOARD_CACHE_TTL_MS)) {
        safeRemoveItem(cacheKey);
        return null;
    }
    return parsed;
}

export function saveHomeDashboardCache(cacheKey, payload) {
    if (!cacheKey) return;
    safeSetJSON(cacheKey, payload);
}
