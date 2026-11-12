import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    HOME_DASHBOARD_CACHE_TTL_MS,
    deserializeLatestSessionFromCache,
    deserializeStatsFromCache,
    getHomeDashboardCacheKey,
    loadHomeDashboardCache,
    saveHomeDashboardCache,
    serializeLatestSessionForCache,
    serializeStatsForCache
} from './homeDashboardCache';

afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
});

describe('homeDashboardCache', () => {
    it('a chave leva a versão e o uid', () => {
        expect(getHomeDashboardCacheKey('u1')).toBe('home_dashboard_snapshot_v1_u1');
    });

    it('stats vão e voltam com as datas dos dias como Date', () => {
        const dia = new Date('2026-11-10T12:00:00Z');
        const stats = { currentStreak: 3, weekDays: [{ fullDate: dia, done: true }], monthDays: [] };
        const ida = JSON.parse(JSON.stringify(serializeStatsForCache(stats)));
        expect(ida.weekDays[0].fullDate).toBe(dia.toISOString());
        const volta = deserializeStatsFromCache(ida);
        expect(volta.currentStreak).toBe(3);
        expect(volta.weekDays[0].fullDate).toEqual(dia);
        expect(volta.monthDays).toEqual([]);
    });

    it('última sessão vai e volta com date como Date', () => {
        const quando = new Date('2026-11-09T18:00:00Z');
        const ida = JSON.parse(JSON.stringify(serializeLatestSessionForCache({ id: 's1', completedAtClient: quando })));
        expect(ida.date).toBe(quando.toISOString());
        expect(deserializeLatestSessionFromCache(ida).date).toEqual(quando);
    });

    it('valores ausentes viram null', () => {
        expect(serializeStatsForCache(null)).toBeNull();
        expect(deserializeStatsFromCache(undefined)).toBeNull();
        expect(serializeLatestSessionForCache(null)).toBeNull();
        expect(deserializeLatestSessionFromCache(null)).toBeNull();
    });

    it('carrega o que foi salvo dentro do prazo e apaga a chave depois dele', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));
        const chave = getHomeDashboardCacheKey('u1');
        saveHomeDashboardCache(chave, { updatedAt: Date.now(), templates: [{ id: 't' }] });
        expect(loadHomeDashboardCache(chave).templates).toEqual([{ id: 't' }]);

        vi.setSystemTime(Date.now() + HOME_DASHBOARD_CACHE_TTL_MS + 1);
        expect(loadHomeDashboardCache(chave)).toBeNull();
        expect(localStorage.getItem(chave)).toBeNull();
    });

    it('sem chave não lê nem grava', () => {
        saveHomeDashboardCache(null, { updatedAt: Date.now() });
        expect(localStorage.length).toBe(0);
        expect(loadHomeDashboardCache(null)).toBeNull();
    });
});
